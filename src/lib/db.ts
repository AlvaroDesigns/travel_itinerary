import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CbMmd3Q4pgEF@ep-steep-rice-ahb1b2de-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Standard pattern to prevent hot-reload from establishing too many connection pools in development
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

// Default trip data for seeding
const DEFAULT_VIETNAM_TRIP = {
  id: 'vietnam-2026',
  name: 'Vietnam Mágico',
  startDate: '2026-06-19',
  endDate: '2026-07-05',
  budget: 2500,
  imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  description: 'Un viaje inolvidable volando con Etihad Airways, estancia en Soleil Boutique Hotel Hanoi y Viettrekking Sapa.',
  notes: 'Llevar pasaporte, seguro de viaje, adaptadores de enchufe tipo A/C/G y calzado cómodo. Cambiar algo de efectivo a Dong vietnamitas (VND) al llegar.',
  activities: [
    {
      id: 'act-new-1',
      type: 'flight',
      date: '2026-06-19',
      time: '10:15',
      price: 0,
      details: {
        flightNumber: 'EY116',
        airline: 'Etihad Airways',
        origin: 'PMI (Palma de Mallorca)',
        destination: 'AUH (Abu Dhabi)',
        arrivalTime: '18:45',
      }
    },
    {
      id: 'act-new-2',
      type: 'flight',
      date: '2026-06-19',
      time: '21:05',
      price: 0,
      details: {
        flightNumber: 'EY432',
        airline: 'Etihad Airways',
        origin: 'AUH (Abu Dhabi)',
        destination: 'HAN (Hanoi)',
        arrivalTime: '06:40',
      }
    },
    {
      id: 'act-new-transfer-1',
      type: 'transfer',
      date: '2026-06-20',
      time: '06:40',
      price: 10,
      details: {
        transportType: 'taxi',
        origin: 'Aeropuerto de Hanói (Terminal 2)',
        destination: 'Soleil Boutique Hotel (Old Quarter, Hoàn Kiếm)',
        duration: '35-50 min',
        description: 'Opción 1: Grab (la que recomiendo). Tiempo: 35-50 min (según tráfico). Precio: 250.000-350.000 VND (8-12 €)',
      }
    },
    {
      id: 'act-new-3',
      type: 'hotel',
      date: '2026-06-20',
      time: '14:00',
      price: 0,
      details: {
        hotelName: 'Soleil Boutique Hotel Hanoi',
        address: '211 Hang Bong Street, Hanói, Vietnam, 10000',
        checkIn: '14:00',
        checkOut: '12:00',
      }
    },
    {
      id: 'act-new-4',
      type: 'hotel',
      date: '2026-06-22',
      time: '14:00',
      price: 0,
      details: {
        hotelName: 'Viettrekking Sapa',
        address: 'Hoàng Liên, Sapa, Vietnam, 333320',
        checkIn: '14:00',
        checkOut: '12:00',
      }
    },
    {
      id: 'act-new-transfer-2',
      type: 'transfer',
      date: '2026-06-23',
      time: '21:30',
      price: 0,
      details: {
        transportType: 'bus',
        origin: 'Viettrekking Coffee, Sapa',
        destination: 'Tam Coc Agency, Ninh Binh',
        duration: '8h 15m',
        description: 'Autobús nocturno (HK Buslines) • Cabina individual inferior (Lower Single Cabin). Asientos de masaje, aire acondicionado, WiFi y TV. Llega a Ninh Binh a las 05:45 del 24 de jun. Info de reserva: https://12go.asia/es/checkout/a87b4209',
      }
    },
    {
      id: 'act-new-5',
      type: 'flight',
      date: '2026-07-04',
      time: '15:55',
      price: 0,
      details: {
        flightNumber: 'EY405',
        airline: 'Etihad Airways',
        origin: 'BKK (Bangkok)',
        destination: 'AUH (Abu Dhabi)',
        arrivalTime: '19:10',
      }
    },
    {
      id: 'act-new-6',
      type: 'flight',
      date: '2026-07-05',
      time: '02:55',
      price: 0,
      details: {
        flightNumber: 'EY115',
        airline: 'Etihad Airways',
        origin: 'AUH (Abu Dhabi)',
        destination: 'PMI (Palma de Mallorca)',
        arrivalTime: '08:15',
      }
    }
  ]
};

// Auto-run schema initialization on start/import
let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Trips Table
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

    // 3. Create Activities Table
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

    // 4. Seed Default User (hello@alvarodesigns.com / Itinerary2026$)
    const userEmail = 'hello@alvarodesigns.com';
    const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    
    let userId: number;
    const correctPassword = 'Itinerary2026$'; // Corrected typo
    
    if (checkUser.rows.length === 0) {
      const hashedPassword = await bcryptjs.hash(correctPassword, 10);
      const insertUser = await client.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
        [userEmail, hashedPassword]
      );
      userId = insertUser.rows[0].id;
      console.log(`Seeded default user: ${userEmail}`);
    } else {
      userId = checkUser.rows[0].id;
      // Force update password to correct spelling
      const hashedPassword = await bcryptjs.hash(correctPassword, 10);
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    }

    // 5. Seed default Vietnam trip for this user if they have 0 trips or have the old seed dates
    const checkTrips = await client.query('SELECT * FROM trips WHERE user_id = $1 AND id = $2', [userId, DEFAULT_VIETNAM_TRIP.id]);
    
    let shouldSeed = false;
    if (checkTrips.rows.length === 0) {
      shouldSeed = true;
    } else if (checkTrips.rows[0].start_date === '2026-10-04') {
      // Clean up the old October default trip to re-seed with the new June-July dates
      await client.query('DELETE FROM trips WHERE id = $1', [DEFAULT_VIETNAM_TRIP.id]);
      shouldSeed = true;
    }

    if (shouldSeed) {
      await client.query(
        `INSERT INTO trips (id, user_id, name, start_date, end_date, budget, image_url, description, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          DEFAULT_VIETNAM_TRIP.id,
          userId,
          DEFAULT_VIETNAM_TRIP.name,
          DEFAULT_VIETNAM_TRIP.startDate,
          DEFAULT_VIETNAM_TRIP.endDate,
          DEFAULT_VIETNAM_TRIP.budget,
          DEFAULT_VIETNAM_TRIP.imageUrl,
          DEFAULT_VIETNAM_TRIP.description,
          DEFAULT_VIETNAM_TRIP.notes
        ]
      );

      for (const act of DEFAULT_VIETNAM_TRIP.activities) {
        await client.query(
          `INSERT INTO activities (id, trip_id, type, date, time, price, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            act.id,
            DEFAULT_VIETNAM_TRIP.id,
            act.type,
            act.date,
            act.time,
            act.price,
            JSON.stringify(act.details)
          ]
        );
      }
      console.log('Seeded default Vietnam trip and activities for hello@alvarodesigns.com');
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
