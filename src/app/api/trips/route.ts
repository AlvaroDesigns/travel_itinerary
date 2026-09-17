import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const tripsRes = await pool.query(
      `SELECT t.*, c.name as client_name, c.email as client_email,
              u.name as owner_name, u.email as owner_email, u.preferences as owner_preferences
       FROM trips t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN clients c ON c.id = t.client_id
       WHERE t.user_id = $1
          OR ($2 <> 'particular' AND u.tenant_id = $2)
          OR ($3 = 'superuser' OR $3 = 'superadmin')
       ORDER BY t.start_date ASC`,
      [session.userId, session.tenantId || 'particular', session.role]
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
        clientId: tripRow.client_id || null,
        clientName: tripRow.client_name || null,
        clientEmail: tripRow.client_email || null,
        ownerId: tripRow.user_id || null,
        ownerName: tripRow.owner_name || null,
        ownerEmail: tripRow.owner_email || null,
        ownerAvatar: (tripRow.owner_preferences?.avatar as string) || null,
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
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, startDate, endDate, budget, imageUrl, description, notes, clientId } = await request.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    const tripId = `trip-${Date.now()}`;

    await pool.query(
      `INSERT INTO trips (id, user_id, client_id, name, start_date, end_date, budget, image_url, description, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tripId,
        session.userId,
        clientId || null,
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
      clientId: clientId || null,
      activities: []
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Error al crear el viaje' }, { status: 500 });
  }
}
