import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/db';

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
    // Check ownership or tenant membership
    const tripCheck = await pool.query<{ id: string; user_id: number; tenant_id: string }>(
      `SELECT t.id, t.user_id, u.tenant_id 
       FROM trips t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [id]
    );
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    const trip = tripCheck.rows[0];
    const hasPermission =
      trip.user_id === session.userId ||
      (session.tenantId && session.tenantId !== 'particular' && trip.tenant_id === session.tenantId) ||
      session.role === 'superuser' ||
      session.role === 'superadmin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { name, startDate, endDate, budget, imageUrl, description, notes, clientId } = await request.json();

    await pool.query(
      `UPDATE trips
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           budget = COALESCE($4, budget),
           image_url = COALESCE($5, image_url),
           description = COALESCE($6, description),
           notes = COALESCE($7, notes),
           client_id = CASE WHEN $8::boolean THEN $9 ELSE client_id END
       WHERE id = $10`,
      [
        name ?? null,
        startDate ?? null,
        endDate ?? null,
        budget ?? null,
        imageUrl ?? null,
        description ?? null,
        notes ?? null,
        clientId !== undefined,
        clientId || null,
        id,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json({ error: 'Error al actualizar el viaje' }, { status: 500 });
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
    // Check ownership or tenant membership
    const tripCheck = await pool.query<{ id: string; user_id: number; tenant_id: string }>(
      `SELECT t.id, t.user_id, u.tenant_id 
       FROM trips t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [id]
    );
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    const trip = tripCheck.rows[0];
    const hasPermission =
      trip.user_id === session.userId ||
      (session.tenantId && session.tenantId !== 'particular' && trip.tenant_id === session.tenantId) ||
      session.role === 'superuser' ||
      session.role === 'superadmin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json({ error: 'Error al eliminar el viaje' }, { status: 500 });
  }
}
