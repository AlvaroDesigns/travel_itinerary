import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id: tripId, activityId } = await params;

  try {
    // Check ownership of trip
    const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    if (tripCheck.rows[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check activity belongs to trip
    const actCheck = await pool.query('SELECT * FROM activities WHERE id = $1 AND trip_id = $2', [activityId, tripId]);
    if (actCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const { type, date, time, price, ...details } = await request.json();

    if (!type || !date || !time) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    await pool.query(
      `UPDATE activities
       SET type = $1,
           date = $2,
           time = $3,
           price = $4,
           details = $5
       WHERE id = $6 AND trip_id = $7`,
      [
        type,
        date,
        time,
        price || 0,
        JSON.stringify(details),
        activityId,
        tripId
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
    console.error('Update activity error:', error);
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id: tripId, activityId } = await params;

  try {
    // Check ownership of trip
    const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [tripId]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    if (tripCheck.rows[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check activity belongs to trip
    const actCheck = await pool.query('SELECT * FROM activities WHERE id = $1 AND trip_id = $2', [activityId, tripId]);
    if (actCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    await pool.query('DELETE FROM activities WHERE id = $1 AND trip_id = $2', [activityId, tripId]);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 });
  }
}
