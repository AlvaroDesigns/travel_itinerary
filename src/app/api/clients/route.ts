import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const clientsRes = await pool.query(
      `SELECT c.*, 
              COUNT(t.id)::int as assigned_trips_count,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', t.id,
                    'name', t.name,
                    'startDate', t.start_date,
                    'endDate', t.end_date
                  )
                ) FILTER (WHERE t.id IS NOT NULL),
                '[]'::json
              ) as assigned_trips
       FROM clients c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN trips t ON t.client_id = c.id
       WHERE c.user_id = $1
          OR ($2 <> 'particular' AND u.tenant_id = $2)
          OR ($3 = 'superuser' OR $3 = 'superadmin')
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [session.userId, session.tenantId || 'particular', session.role]
    );

    const clients = clientsRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      documentId: row.document_id || '',
      nationality: row.nationality || '',
      notes: row.notes || '',
      status: row.status || 'activo',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      assignedTripsCount: row.assigned_trips_count || 0,
      assignedTrips: row.assigned_trips || [],
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Fetch clients error:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const body = await request.json();
    const { name, email, phone, documentId, nationality, notes, status, assignedTripIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 });
    }

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await pool.query(
      `INSERT INTO clients (id, user_id, name, email, phone, document_id, nationality, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        clientId,
        session.userId,
        name.trim(),
        email?.trim() || '',
        phone?.trim() || '',
        documentId?.trim() || '',
        nationality?.trim() || '',
        notes?.trim() || '',
        status || 'activo',
      ]
    );

    // If trips were specified to be assigned
    if (Array.isArray(assignedTripIds) && assignedTripIds.length > 0) {
      await pool.query(
        `UPDATE trips SET client_id = $1 WHERE id = ANY($2::text[]) AND user_id = $3`,
        [clientId, assignedTripIds, session.userId]
      );
    }

    return NextResponse.json({
      id: clientId,
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      documentId: documentId?.trim() || '',
      nationality: nationality?.trim() || '',
      notes: notes?.trim() || '',
      status: status || 'activo',
      createdAt: new Date().toISOString(),
      assignedTripsCount: Array.isArray(assignedTripIds) ? assignedTripIds.length : 0,
      assignedTrips: [],
    });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
