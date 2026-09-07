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
    const userRes = await pool.query(
      'SELECT id, email, role, name, phone, company, preferences, created_at FROM users WHERE id = $1',
      [session.userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const row = userRes.rows[0];
    return NextResponse.json({
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name || '',
      phone: row.phone || '',
      company: row.company || '',
      preferences: row.preferences || {
        language: 'es',
        timezone: 'Europe/Madrid',
        weekStart: 'lunes',
        timeFormat: '24h',
        dateFormat: 'dd/mm/yyyy',
        decimals: 'coma',
        currencyPosition: 'fin',
        currency: 'EUR',
        notifications: {
          newTrips: true,
          vouchers: true,
          clientReminders: true,
          weeklySummary: false,
          securityAlerts: true,
        },
      },
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const body = await request.json();
    const { name, phone, company, preferences } = body;

    await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           company = COALESCE($3, company),
           preferences = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE preferences END
       WHERE id = $5`,
      [
        name !== undefined ? name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        company !== undefined ? company.trim() : null,
        preferences ? JSON.stringify(preferences) : null,
        session.userId,
      ]
    );

    return NextResponse.json({ success: true, message: 'Perfil actualizado con éxito' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
