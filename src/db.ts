import { Pool } from 'pg';
import { SEED_PROPERTIES } from './data/seedProperties.ts';
import { BookingResponse, Property } from './types/property.ts';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to start RentNest backend');
}

export const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS escrow_inquiries (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const property of SEED_PROPERTIES) {
    await pool.query(
      'INSERT INTO properties (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [property.id, property],
    );
  }

  await pool.query(`
    UPDATE properties
    SET data = jsonb_set(
      data,
      '{images}',
      (
        SELECT jsonb_agg(to_jsonb(REPLACE(image_url, '/src/assets/images/', '/images/')))
        FROM jsonb_array_elements_text(data->'images') AS image_url
      )
    )
    WHERE data->'images' IS NOT NULL
      AND (data->'images')::text LIKE '%/src/assets/images/%'
  `);
}

export async function getProperties(): Promise<Property[]> {
  const result = await pool.query<{ data: Property }>(
    'SELECT data FROM properties ORDER BY created_at DESC',
  );
  return result.rows.map((row) => row.data);
}

export async function getProperty(id: string): Promise<Property | undefined> {
  const result = await pool.query<{ data: Property }>(
    'SELECT data FROM properties WHERE id = $1',
    [id],
  );
  return result.rows[0]?.data;
}

export async function saveProperty(property: Property): Promise<void> {
  await pool.query(
    'INSERT INTO properties (id, data) VALUES ($1, $2)',
    [property.id, property],
  );
}

export async function saveBooking(booking: BookingResponse): Promise<void> {
  await pool.query(
    'INSERT INTO bookings (id, property_id, data) VALUES ($1, $2, $3)',
    [booking.id, booking.propertyId, booking],
  );
}

export async function saveEscrowInquiry(inquiry: { propertyId: string; id: string; createdAt: string; escrowAccountRef: string }): Promise<void> {
  await pool.query(
    'INSERT INTO escrow_inquiries (id, property_id, data) VALUES ($1, $2, $3)',
    [inquiry.id, inquiry.propertyId, inquiry],
  );
}