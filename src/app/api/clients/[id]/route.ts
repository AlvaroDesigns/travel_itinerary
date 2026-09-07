import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await initDb();
    const clientRes = await pool.query(
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
       LEFT JOIN trips t ON t.client_id = c.id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [id, session.userId]
    );

    if (clientRes.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const row = clientRes.rows[0];
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await initDb();
    const clientCheck = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [id, session.userId]
    );

    if (clientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, documentId, nationality, notes, status, assignedTripIds } = body;

    await pool.query(
      `UPDATE clients
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           document_id = COALESCE($4, document_id),
           nationality = COALESCE($5, nationality),
           notes = COALESCE($6, notes),
           status = COALESCE($7, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9`,
      [
        name !== undefined ? name.trim() : null,
        email !== undefined ? email.trim() : null,
        phone !== undefined ? phone.trim() : null,
        documentId !== undefined ? documentId.trim() : null,
        nationality !== undefined ? nationality.trim() : null,
        notes !== undefined ? notes.trim() : null,
        status || null,
        id,
        session.userId,
      ]
    );

    // If assignedTripIds is provided, sync trip assignments
    if (Array.isArray(assignedTripIds)) {
      // Remove all trips currently assigned to this client
      await pool.query(
        `UPDATE trips SET client_id = NULL WHERE client_id = $1 AND user_id = $2`,
        [id, session.userId]
      );
      // Assign specified trips
      if (assignedTripIds.length > 0) {
        await pool.query(
          `UPDATE trips SET client_id = $1 WHERE id = ANY($2::text[]) AND user_id = $3`,
          [id, assignedTripIds, session.userId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await initDb();
    const clientCheck = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [id, session.userId]
    );

    if (clientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Set client_id = NULL on trips
    await pool.query('UPDATE trips SET client_id = NULL WHERE client_id = $1', [id]);
    await pool.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [id, session.userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 });
  }
}
