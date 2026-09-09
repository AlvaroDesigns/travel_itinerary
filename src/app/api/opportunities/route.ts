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
    let result = await pool.query(
      `SELECT o.*, 
              c.name AS client_name,
              c.email AS client_email,
              c.phone AS client_phone
       FROM opportunities o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN clients c ON c.id = o.client_id
       WHERE o.user_id = $1
          OR ($2 <> 'particular' AND u.tenant_id = $2)
          OR ($3 = 'superuser' OR $3 = 'superadmin')
       ORDER BY o.created_at DESC`,
      [session.userId, session.tenantId || 'particular', session.role]
    );

    // Auto-seed sample realistic opportunities if user has none yet
    if (result.rows.length === 0) {
      const sampleOpps = [
        {
          id: `opp-sample-1-${session.userId}`,
          title: 'Viaje de novios a Japón y Bali',
          stage: 'propuesta',
          amount: 7850,
          currency: 'EUR',
          agent_name: 'Álvaro González',
          destination: 'Tokio, Kioto y Ubud',
          travelers_count: 2,
          start_date: '2026-10-15',
          end_date: '2026-10-28',
          initial_notes: 'Buscan hoteles boutique 5* y traslados privados.',
        },
        {
          id: `opp-sample-2-${session.userId}`,
          title: 'Escapada familiar a Riviera Maya',
          stage: 'nuevo',
          amount: 4200,
          currency: 'EUR',
          agent_name: 'Laura Gómez',
          destination: 'Playa del Carmen',
          travelers_count: 4,
          start_date: '2026-11-01',
          end_date: '2026-11-08',
          initial_notes: 'Familia con 2 niños, régimen todo incluido cerca de la playa.',
        },
        {
          id: `opp-sample-3-${session.userId}`,
          title: 'Circuito Cultural por Italia',
          stage: 'contactado',
          amount: 3400,
          currency: 'EUR',
          agent_name: 'Carlos Mendoza',
          destination: 'Roma, Florencia y Venecia',
          travelers_count: 2,
          start_date: '2026-09-25',
          end_date: '2026-10-04',
          initial_notes: 'Interesados en entradas VIP sin colas para museos y trenes de alta velocidad.',
        },
        {
          id: `opp-sample-4-${session.userId}`,
          title: 'Safari en Kenia & Costa de Zanzíbar',
          stage: 'ganada',
          amount: 9600,
          currency: 'EUR',
          agent_name: 'Álvaro González',
          destination: 'Masái Mara y Zanzíbar',
          travelers_count: 2,
          start_date: '2026-12-10',
          end_date: '2026-12-22',
          initial_notes: 'Reserva confirmada. Póliza médica emitida.',
        },
      ];

      for (const opp of sampleOpps) {
        await pool.query(
          `INSERT INTO opportunities (id, user_id, title, stage, amount, currency, agent_name, destination, travelers_count, start_date, end_date, initial_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            opp.id,
            session.userId,
            opp.title,
            opp.stage,
            opp.amount,
            opp.currency,
            opp.agent_name,
            opp.destination,
            opp.travelers_count,
            opp.start_date,
            opp.end_date,
            opp.initial_notes,
          ]
        );
      }

      result = await pool.query(
        `SELECT o.*, 
                c.name AS client_name,
                c.email AS client_email,
                c.phone AS client_phone
         FROM opportunities o
         LEFT JOIN clients c ON c.id = o.client_id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC`,
        [session.userId]
      );
    }

    const opportunities = result.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id || null,
      clientName: row.client_name || '',
      clientEmail: row.client_email || '',
      clientPhone: row.client_phone || '',
      title: row.title,
      stage: row.stage || 'nuevo',
      amount: Number(row.amount) || 0,
      currency: row.currency || 'EUR',
      agentName: row.agent_name || '',
      startDate: row.start_date || '',
      endDate: row.end_date || '',
      destination: row.destination || '',
      travelersCount: Number(row.travelers_count) || 1,
      initialNotes: row.initial_notes || '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Fetch opportunities error:', error);
    return NextResponse.json({ error: 'Error al obtener las oportunidades' }, { status: 500 });
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
    const {
      title,
      stage = 'nuevo',
      amount = 0,
      currency = 'EUR',
      agentName = '',
      clientId,
      newClient, // { name, email, phone }
      startDate = '',
      endDate = '',
      destination = '',
      travelersCount = 1,
      initialNotes = '',
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'El nombre de la oportunidad es obligatorio' }, { status: 400 });
    }

    let resolvedClientId = clientId || null;
    let clientName = '';
    let clientEmail = '';
    let clientPhone = '';

    // If a new client was passed in
    if (!resolvedClientId && newClient && newClient.name?.trim()) {
      resolvedClientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      clientName = newClient.name.trim();
      clientEmail = newClient.email?.trim() || '';
      clientPhone = newClient.phone?.trim() || '';

      await pool.query(
        `INSERT INTO clients (id, user_id, name, email, phone, status)
         VALUES ($1, $2, $3, $4, $5, 'prospecto')`,
        [resolvedClientId, session.userId, clientName, clientEmail, clientPhone]
      );
    } else if (resolvedClientId) {
      const clientRes = await pool.query(
        `SELECT name, email, phone FROM clients WHERE id = $1 AND user_id = $2`,
        [resolvedClientId, session.userId]
      );
      if (clientRes.rows[0]) {
        clientName = clientRes.rows[0].name;
        clientEmail = clientRes.rows[0].email || '';
        clientPhone = clientRes.rows[0].phone || '';
      }
    }

    const opportunityId = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await pool.query(
      `INSERT INTO opportunities (
        id, user_id, client_id, title, stage, amount, currency,
        agent_name, start_date, end_date, destination, travelers_count, initial_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        opportunityId,
        session.userId,
        resolvedClientId,
        title.trim(),
        stage,
        Number(amount) || 0,
        currency || 'EUR',
        agentName.trim(),
        startDate || '',
        endDate || '',
        destination.trim(),
        Number(travelersCount) || 1,
        initialNotes.trim(),
      ]
    );

    const newOpportunity = {
      id: opportunityId,
      clientId: resolvedClientId,
      clientName,
      clientEmail,
      clientPhone,
      title: title.trim(),
      stage,
      amount: Number(amount) || 0,
      currency: currency || 'EUR',
      agentName: agentName.trim(),
      startDate: startDate || '',
      endDate: endDate || '',
      destination: destination.trim(),
      travelersCount: Number(travelersCount) || 1,
      initialNotes: initialNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newOpportunity, { status: 201 });
  } catch (error) {
    console.error('Create opportunity error:', error);
    return NextResponse.json({ error: 'Error al crear la oportunidad' }, { status: 500 });
  }
}
