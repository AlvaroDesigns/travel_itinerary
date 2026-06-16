import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check ownership
    const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [id]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    if (tripCheck.rows[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { name, startDate, endDate, budget, imageUrl, description, notes } = await request.json();

    await pool.query(
      `UPDATE trips
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           budget = COALESCE($4, budget),
           image_url = COALESCE($5, image_url),
           description = COALESCE($6, description),
           notes = COALESCE($7, notes)
       WHERE id = $8`,
      [name, startDate, endDate, budget, imageUrl, description, notes, id]
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check ownership
    const tripCheck = await pool.query('SELECT user_id FROM trips WHERE id = $1', [id]);
    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }
    if (tripCheck.rows[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json({ error: 'Error al eliminar el viaje' }, { status: 500 });
  }
}
