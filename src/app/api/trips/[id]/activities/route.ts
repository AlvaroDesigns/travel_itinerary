import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id: tripId } = await params;

  try {
    // Check ownership of trip
    const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    if (tripCheck.rows[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { type, date, time, price, ...details } = await request.json();

    if (!type || !date || !time) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    const activityId = `act-${Date.now()}`;

    await pool.query(
      `INSERT INTO activities (id, trip_id, type, date, time, price, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        activityId,
        tripId,
        type,
        date,
        time,
        price || 0,
        JSON.stringify(details)
      ]
    );

    return NextResponse.json({
      id: activityId,
      type,
      date,
      time,
      price: parseFloat(price || 0),
      ...details
    });

  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Error al agregar actividad' }, { status: 500 });
  }
}
