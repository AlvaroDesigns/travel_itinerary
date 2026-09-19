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
const globalForDb = global as unknown as { pool: Pool | undefined; isInitialized: boolean | undefined };

export const pool = globalForDb.pool || new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export async function initDb() {
  if (globalForDb.isInitialized) return;
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
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('superuser', 'superadmin', 'admin', 'user')),
        tenant_id VARCHAR(100) NOT NULL DEFAULT 'particular',
        agency_name VARCHAR(255) NOT NULL DEFAULT 'Particular',
        plan_type VARCHAR(50) NOT NULL DEFAULT 'particular',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) NOT NULL DEFAULT 'particular',
        ADD COLUMN IF NOT EXISTS agency_name VARCHAR(255) NOT NULL DEFAULT 'Particular',
        ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) NOT NULL DEFAULT 'particular',
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '',
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '',
        ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT '',
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT '',
        ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
    `);
    await client.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    await client.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check CHECK (role IN ('superuser', 'superadmin', 'admin', 'user'));
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
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        document_id VARCHAR(50) DEFAULT '',
        nationality VARCHAR(100) DEFAULT '',
        notes TEXT DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'prospecto', 'inactivo')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL,
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
      ALTER TABLE trips
        ADD COLUMN IF NOT EXISTS client_id VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL;
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
        reminder_time VARCHAR(5) NOT NULL DEFAULT '09:00',
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
        ADD COLUMN IF NOT EXISTS reminder_time VARCHAR(5) NOT NULL DEFAULT '09:00',
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
      CREATE TABLE IF NOT EXISTS opportunities (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_id VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        stage VARCHAR(50) NOT NULL DEFAULT 'nuevo' CHECK (stage IN ('nuevo', 'contactado', 'propuesta', 'ganada', 'perdido')),
        amount NUMERIC NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
        agent_name VARCHAR(255) DEFAULT '',
        start_date VARCHAR(10),
        end_date VARCHAR(10),
        destination VARCHAR(255),
        travelers_count INTEGER DEFAULT 1,
        initial_notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS opportunities_user_id_idx ON opportunities(user_id);
      CREATE INDEX IF NOT EXISTS opportunities_client_id_idx ON opportunities(client_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        tenant_id VARCHAR(100) PRIMARY KEY,
        agency_name VARCHAR(255) NOT NULL DEFAULT '',
        agency_logo TEXT DEFAULT '',
        brand_color VARCHAR(50) DEFAULT '#0066FF',
        agency_cif VARCHAR(50) DEFAULT '',
        terms_text TEXT DEFAULT '',
        agency_url VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      ALTER TABLE tenant_settings
        ADD COLUMN IF NOT EXISTS agency_url VARCHAR(255) DEFAULT '';
    `);

    // Ensure known agency tenants exist in tenant_settings
    await client.query(`
      INSERT INTO tenant_settings (tenant_id, agency_name, agency_logo, brand_color)
      VALUES ('alvarodesigns', 'Alvaro Designs Agency', '', '#0066FF')
      ON CONFLICT (tenant_id) DO NOTHING;

      INSERT INTO tenant_settings (tenant_id, agency_name, agency_logo, brand_color)
      VALUES ('smy-travel', 'Smy Travel', '', '#0066FF')
      ON CONFLICT (tenant_id) DO NOTHING;
    `);

    // Multi-tenant logo fix: if user 1 (hello@alvarodesigns.com) has a logo that belongs to smy-travel (or was leaked),
    // assign it to smy-travel tenant settings and users, and clear it from user 1 / alvarodesigns
    await client.query(`
      DO $$
      DECLARE
        user1_logo TEXT;
      BEGIN
        SELECT preferences->>'agencyLogo' INTO user1_logo FROM users WHERE id = 1;
        IF user1_logo IS NOT NULL AND length(user1_logo) > 0 THEN
          -- Save the logo to smy-travel tenant settings and users
          UPDATE tenant_settings
          SET agency_logo = user1_logo, updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = 'smy-travel';

          UPDATE users
          SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{agencyLogo}', to_jsonb(user1_logo))
          WHERE tenant_id = 'smy-travel';

          -- Clear from hello@alvarodesigns.com and alvarodesigns tenant
          UPDATE users
          SET preferences = preferences - 'agencyLogo'
          WHERE id = 1;

          UPDATE tenant_settings
          SET agency_logo = '', updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = 'alvarodesigns';
        END IF;
      END $$;
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
        `INSERT INTO users (email, password, role, is_active, tenant_id, agency_name, plan_type)
         VALUES ($1, $2, 'admin', TRUE, 'particular', 'Particular', 'particular')
         ON CONFLICT (email) DO UPDATE SET
           is_active = TRUE`,
        [initialAdminEmail, initialAdminPasswordHash]
      );
    }

    // Ensure hello@alvarodesigns.com is superuser and owns the 'alvarodesigns' agency tenant
    const defaultPasswordHash = await bcryptjs.hash('WanderlustAdmin2026!', 12);
    await client.query(`
      INSERT INTO users (email, password, role, name, is_active, tenant_id, agency_name, plan_type)
      VALUES ('hello@alvarodesigns.com', $1, 'superuser', 'Alvaro Designs Admin', TRUE, 'alvarodesigns', 'Alvaro Designs Agency', 'agency_enterprise')
      ON CONFLICT (email) DO UPDATE SET
        password = $1,
        role = 'superuser',
        tenant_id = 'alvarodesigns',
        agency_name = 'Alvaro Designs Agency',
        plan_type = 'agency_enterprise',
        is_active = TRUE
    `, [defaultPasswordHash]);

    // Ensure alvaro.bonilla@me.com is inside the 'alvarodesigns' agency plan
    await client.query(`
      INSERT INTO users (email, password, role, name, is_active, tenant_id, agency_name, plan_type)
      VALUES ('alvaro.bonilla@me.com', $1, 'user', 'Álvaro Bonilla', TRUE, 'alvarodesigns', 'Alvaro Designs Agency', 'agency_enterprise')
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = 'alvarodesigns',
        agency_name = 'Alvaro Designs Agency',
        plan_type = 'agency_enterprise'
    `, [defaultPasswordHash]);

    // Ensure daviidjd@gmail.com is a particular user
    await client.query(`
      INSERT INTO users (email, password, role, name, is_active, tenant_id, agency_name, plan_type)
      VALUES ('daviidjd@gmail.com', $1, 'user', 'David JD', TRUE, 'particular', 'Particular', 'particular')
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = 'particular',
        agency_name = 'Particular',
        plan_type = 'particular'
    `, [defaultPasswordHash]);

    // Ensure aina is a particular user
    await client.query(`
      INSERT INTO users (email, password, role, name, is_active, tenant_id, agency_name, plan_type)
      VALUES ('aina@wanderlust.com', $1, 'user', 'Aina', TRUE, 'particular', 'Particular', 'particular')
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = 'particular',
        agency_name = 'Particular',
        plan_type = 'particular'
    `, [defaultPasswordHash]);

    await client.query('COMMIT');
    globalForDb.isInitialized = true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}
