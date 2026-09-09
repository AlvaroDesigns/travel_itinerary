import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { signSession } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { name, email, password, userType, agencyName, phone, agencyType } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Todos los campos obligatorios deben completarse' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe una cuenta registrada con este correo electrónico' }, { status: 400 });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const isAgency = userType === 'agency';
    const finalAgencyName = isAgency ? (agencyName?.trim() || 'Mi Agencia') : 'Particular';
    const finalTenantId = isAgency ? slugify(finalAgencyName) || 'agencia' : 'particular';
    const role = isAgency ? 'admin' : 'user';
    const planType = isAgency ? 'agency_free' : 'particular';

    const insertResult = await pool.query<{
      id: number;
      email: string;
      role: 'superuser' | 'superadmin' | 'admin' | 'user';
      name: string | null;
      tenant_id: string | null;
      agency_name: string | null;
    }>(
      `INSERT INTO users (email, password, role, name, tenant_id, agency_name, plan_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, email, role, name, tenant_id, agency_name`,
      [cleanEmail, hashedPassword, role, name.trim(), finalTenantId, finalAgencyName, planType]
    );

    const newUser = insertResult.rows[0];

    // Sign session and set cookie for immediate seamless access
    const token = await signSession({ userId: newUser.id, email: newUser.email });
    const cookieStore = await cookies();
    cookieStore.set('travel_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name || undefined,
        tenantId: newUser.tenant_id || undefined,
        agencyName: newUser.agency_name || undefined,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error interno del servidor al crear la cuenta' }, { status: 500 });
  }
}
