import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

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
    const body = await request.json();
    const {
      title,
      stage,
      amount,
      currency,
      agentName,
      clientId,
      startDate,
      endDate,
      destination,
      travelersCount,
      initialNotes,
    } = body;

    const existingRes = await pool.query(
      `SELECT * FROM opportunities WHERE id = $1 AND user_id = $2`,
      [id, session.userId]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 });
    }

    const current = existingRes.rows[0];

    const nextTitle = title !== undefined ? title.trim() : current.title;
    const nextStage = stage !== undefined ? stage : current.stage;
    const nextAmount = amount !== undefined ? Number(amount) : Number(current.amount);
    const nextCurrency = currency !== undefined ? currency : current.currency;
    const nextAgentName = agentName !== undefined ? agentName.trim() : current.agent_name;
    const nextClientId = clientId !== undefined ? (clientId || null) : current.client_id;
    const nextStartDate = startDate !== undefined ? startDate : current.start_date;
    const nextEndDate = endDate !== undefined ? endDate : current.end_date;
    const nextDestination = destination !== undefined ? destination.trim() : current.destination;
    const nextTravelersCount = travelersCount !== undefined ? Number(travelersCount) : current.travelers_count;
    const nextNotes = initialNotes !== undefined ? initialNotes.trim() : current.initial_notes;

    await pool.query(
      `UPDATE opportunities SET
        title = $1,
        stage = $2,
        amount = $3,
        currency = $4,
        agent_name = $5,
        client_id = $6,
        start_date = $7,
        end_date = $8,
        destination = $9,
        travelers_count = $10,
        initial_notes = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND user_id = $13`,
      [
        nextTitle,
        nextStage,
        nextAmount,
        nextCurrency,
        nextAgentName,
        nextClientId,
        nextStartDate,
        nextEndDate,
        nextDestination,
        nextTravelersCount,
        nextNotes,
        id,
        session.userId,
      ]
    );

    let clientName = '';
    let clientEmail = '';
    let clientPhone = '';
    if (nextClientId) {
      const clientRes = await pool.query(
        `SELECT name, email, phone FROM clients WHERE id = $1 AND user_id = $2`,
        [nextClientId, session.userId]
      );
      if (clientRes.rows[0]) {
        clientName = clientRes.rows[0].name;
        clientEmail = clientRes.rows[0].email || '';
        clientPhone = clientRes.rows[0].phone || '';
      }
    }

    return NextResponse.json({
      id,
      clientId: nextClientId,
      clientName,
      clientEmail,
      clientPhone,
      title: nextTitle,
      stage: nextStage,
      amount: nextAmount,
      currency: nextCurrency,
      agentName: nextAgentName,
      startDate: nextStartDate,
      endDate: nextEndDate,
      destination: nextDestination,
      travelersCount: nextTravelersCount,
      initialNotes: nextNotes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    return NextResponse.json({ error: 'Error al actualizar la oportunidad' }, { status: 500 });
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
    const deleteRes = await pool.query(
      `DELETE FROM opportunities WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, session.userId]
    );

    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Oportunidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    return NextResponse.json({ error: 'Error al eliminar la oportunidad' }, { status: 500 });
  }
}
