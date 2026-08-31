import bcryptjs from 'bcryptjs';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

async function resolveInitialAdminPasswordHash(value: string): Promise<string> {
  if (BCRYPT_HASH_PATTERN.test(value)) return value;

  console.warn('INITIAL_ADMIN_PASSWORD_HASH no tiene formato bcrypt. Se hasheará para este arranque; actualiza la variable con un hash bcrypt.');
  return bcryptjs.hash(value, 12);
}

// Keep a single pool during development hot reloads.
const globalForDb = global as unknown as { pool: Pool | undefined };

export const pool = globalForDb.pool || new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    await client.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    await client.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id UUID PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_digest CHAR(64) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        attempt_count SMALLINT NOT NULL DEFAULT 0,
        consumed_at TIMESTAMP WITH TIME ZONE,
        invalidated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS password_reset_otps_user_created_at_idx
      ON password_reset_otps (user_id, created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        start_date VARCHAR(10) NOT NULL,
        end_date VARCHAR(10) NOT NULL,
        budget NUMERIC NOT NULL DEFAULT 0,
        image_url TEXT,
        description TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) REFERENCES trips(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        time VARCHAR(5) NOT NULL,
        price NUMERIC NOT NULL DEFAULT 0,
        details JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trip_notification_settings (
        trip_id VARCHAR(255) PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        bcc_emails TEXT[] NOT NULL DEFAULT '{}'::text[],
        reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        reminder_interval_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_interval_days BETWEEN 1 AND 365),
        countdown_mode VARCHAR(20) NOT NULL DEFAULT 'exact' CHECK (countdown_mode IN ('exact', 'surprise')),
        last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
        instructions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        instructions_text TEXT NOT NULL DEFAULT '',
        instructions_sent_at TIMESTAMP WITH TIME ZONE,
        itinerary_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        itinerary_access_hours INTEGER NOT NULL DEFAULT 6 CHECK (itinerary_access_hours BETWEEN 1 AND 720),
        itinerary_access_sent_at TIMESTAMP WITH TIME ZONE,
        public_access_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        public_access_token VARCHAR(255),
        public_show_expenses BOOLEAN NOT NULL DEFAULT FALSE,
        public_itinerary_visibility VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (public_itinerary_visibility IN ('all', 'day_before')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE trip_notification_settings
        ADD COLUMN IF NOT EXISTS public_access_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS public_access_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS public_show_expenses BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS public_itinerary_visibility VARCHAR(20) NOT NULL DEFAULT 'all',
        ADD COLUMN IF NOT EXISTS bcc_emails TEXT[] NOT NULL DEFAULT '{}'::text[];
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS trip_notification_settings_public_access_token_key
      ON trip_notification_settings (public_access_token)
      WHERE public_access_token IS NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        content_key VARCHAR(100) PRIMARY KEY,
        content JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    await client.query(
      `INSERT INTO site_content (content_key, content)
       VALUES ('home', $1::jsonb)
       ON CONFLICT (content_key) DO NOTHING`,
      [JSON.stringify({
        heroBadge: 'Tu compañero de aventuras',
        heroTitle: 'Planifica cada viaje\ncon intención.',
        heroDescription: 'Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.',
      })]
    );

    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const configuredInitialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD_HASH?.trim();
    if (initialAdminEmail && configuredInitialAdminPassword) {
      const initialAdminPasswordHash = await resolveInitialAdminPasswordHash(configuredInitialAdminPassword);
      await client.query(
        `INSERT INTO users (email, password, role, is_active)
         VALUES ($1, $2, 'admin', TRUE)
         ON CONFLICT (email) DO UPDATE SET
           password = EXCLUDED.password,
           role = 'admin',
           is_active = TRUE`,
        [initialAdminEmail, initialAdminPasswordHash]
      );
    }

    await client.query('COMMIT');
    isInitialized = true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}
