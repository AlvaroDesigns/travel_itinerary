import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const tripsRes = await pool.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date ASC',
      [session.userId]
    );

    const trips = [];

    for (const tripRow of tripsRes.rows) {
      const actRes = await pool.query(
        'SELECT * FROM activities WHERE trip_id = $1 ORDER BY date ASC, time ASC',
        [tripRow.id]
      );

      const activities = actRes.rows.map(row => ({
        id: row.id,
        type: row.type,
        date: row.date,
        time: row.time,
        price: parseFloat(row.price),
        ...row.details
      }));

      trips.push({
        id: tripRow.id,
        name: tripRow.name,
        startDate: tripRow.start_date,
        endDate: tripRow.end_date,
        budget: parseFloat(tripRow.budget),
        imageUrl: tripRow.image_url,
        description: tripRow.description,
        notes: tripRow.notes,
        activities
      });
    }

    return NextResponse.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    return NextResponse.json({ error: 'Error al obtener viajes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, startDate, endDate, budget, imageUrl, description, notes } = await request.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    const tripId = `trip-${Date.now()}`;

    await pool.query(
      `INSERT INTO trips (id, user_id, name, start_date, end_date, budget, image_url, description, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tripId,
        session.userId,
        name,
        startDate,
        endDate,
        budget || 0,
        imageUrl || '',
        description || '',
        notes || ''
      ]
    );

    return NextResponse.json({
      id: tripId,
      name,
      startDate,
      endDate,
      budget: parseFloat(budget || 0),
      imageUrl: imageUrl || '',
      description: description || '',
      notes: notes || '',
      activities: []
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Error al crear el viaje' }, { status: 500 });
  }
}
