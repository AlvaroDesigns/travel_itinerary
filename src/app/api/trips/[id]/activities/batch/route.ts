import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: tripId } = await params;
  try {
    const body = await request.json() as { activities?: unknown };
    if (!Array.isArray(body.activities) || body.activities.length < 1 || body.activities.length > 12) return NextResponse.json({ error: 'Selecciona entre 1 y 12 actividades' }, { status: 400 });
    const owner = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, user.userId]);
    if (!owner.rows[0]) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = [];
      for (const activity of body.activities) {
        const item = activity as Record<string, unknown>;
        if (item.type !== 'excursion' || typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || typeof item.time !== 'string' || !/^\d{2}:\d{2}$/.test(item.time) || typeof item.title !== 'string' || typeof item.description !== 'string' || typeof item.duration !== 'string' || typeof item.price !== 'number' || item.price < 0) throw new Error('INVALID_ACTIVITY');
        const id = `act-${crypto.randomUUID()}`;
        await client.query('INSERT INTO activities (id, trip_id, type, date, time, price, details) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, tripId, 'excursion', item.date, item.time, item.price, JSON.stringify({ title: item.title, description: item.description, duration: item.duration })]);
        created.push({ id, type: 'excursion', date: item.date, time: item.time, price: item.price, title: item.title, description: item.description, duration: item.duration });
      }
      await client.query('COMMIT');
      return NextResponse.json(created, { status: 201 });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === 'INVALID_ACTIVITY' ? 'La propuesta contiene una actividad no válida' : 'No se pudieron añadir las actividades' }, { status: 400 });
  }
}
