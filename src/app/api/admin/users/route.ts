import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { type UserRole } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';
import { createWelcomeInvitationEmail, isEmailServiceConfigured, sendEmail } from '@/lib/email';
import { digestOtp, generateOtp, OTP_TTL_MINUTES } from '@/lib/password-reset';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type BulkAction = 'activate' | 'deactivate' | 'changeRole' | 'changeTenant';

type CreatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  tenant_id: string;
  agency_name: string;
  plan_type: string;
  created_at: string;
};

function isUserRole(value: unknown): value is UserRole {
  return value === 'superuser' || value === 'superadmin' || value === 'admin' || value === 'user';
}

function serializeUser(user: CreatedUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    role: user.role,
    isActive: user.is_active,
    tenantId: user.tenant_id,
    agencyName: user.agency_name,
    planType: user.plan_type,
    createdAt: user.created_at,
    tripCount: 0,
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const tenantFilter = url.searchParams.get('tenantId')?.trim() ?? '';

  let sql = `
    SELECT u.id, u.email, u.name, u.role, u.is_active, u.tenant_id, u.agency_name, u.plan_type, u.created_at, COUNT(t.id)::text AS trip_count
    FROM users u
    LEFT JOIN trips t ON t.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  // Superuser and Superadmin can see everything; regular admin only sees users in their own tenant
  if (admin.role !== 'superadmin' && admin.role !== 'superuser') {
    params.push(admin.tenantId || 'particular');
    sql += ` AND u.tenant_id = $${params.length}`;
  } else if (tenantFilter) {
    params.push(tenantFilter);
    sql += ` AND u.tenant_id = $${params.length}`;
  }

  if (query) {
    params.push(`%${query}%`);
    sql += ` AND (LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.name, '')) LIKE $${params.length} OR LOWER(COALESCE(u.agency_name, '')) LIKE $${params.length})`;
  }

  sql += `
    GROUP BY u.id
    ORDER BY 
      CASE 
        WHEN u.role = 'superuser' THEN 0
        WHEN u.role = 'superadmin' THEN 1 
        WHEN u.role = 'admin' THEN 2 
        ELSE 3 
      END,
      u.tenant_id ASC,
      u.created_at ASC
  `;

  const result = await pool.query<{
    id: number;
    email: string;
    name: string | null;
    role: UserRole;
    is_active: boolean;
    tenant_id: string;
    agency_name: string;
    plan_type: string;
    created_at: string;
    trip_count: string;
  }>(sql, params);

  return NextResponse.json(
    result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role,
      isActive: user.is_active,
      tenantId: user.tenant_id || 'particular',
      agencyName: user.agency_name || 'Particular',
      planType: user.plan_type || 'particular',
      createdAt: user.created_at,
      tripCount: Number(user.trip_count),
    }))
  );
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      role?: unknown;
      tenantId?: unknown;
      agencyName?: unknown;
      planType?: unknown;
    };

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    let role = body.role ?? 'user';
    let tenantId = typeof body.tenantId === 'string' && body.tenantId.trim() ? body.tenantId.trim() : 'particular';
    let agencyName = typeof body.agencyName === 'string' && body.agencyName.trim() ? body.agencyName.trim() : 'Particular';
    const planType = typeof body.planType === 'string' && body.planType.trim() ? body.planType.trim() : (tenantId === 'particular' ? 'particular' : 'agency_starter');

    // Only superuser/superadmin can assign 'superuser'/'superadmin' role or create users in any arbitrary tenant
    if (admin.role !== 'superadmin' && admin.role !== 'superuser') {
      if (role === 'superadmin' || role === 'superuser') {
        return NextResponse.json({ error: 'No tienes permisos para crear superusuarios' }, { status: 403 });
      }
      tenantId = admin.tenantId || 'particular';
      agencyName = admin.agencyName || 'Particular';
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Introduce un correo electrónico válido' }, { status: 400 });
    }
    if (!isUserRole(role)) {
      return NextResponse.json({ error: 'El rol indicado no es válido' }, { status: 400 });
    }
    if (!isEmailServiceConfigured()) {
      return NextResponse.json({ error: 'El servicio de email no está configurado. No se puede enviar la invitación.' }, { status: 503 });
    }

    const challengeId = crypto.randomUUID();
    const code = generateOtp();
    const passwordHash = await bcryptjs.hash(randomBytes(48).toString('base64url'), 12);
    const client = await pool.connect();
    let user: CreatedUser;

    try {
      await client.query('BEGIN');
      const result = await client.query<CreatedUser>(
        `INSERT INTO users (email, password, name, role, tenant_id, agency_name, plan_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role, is_active, tenant_id, agency_name, plan_type, created_at`,
        [email, passwordHash, name, role, tenantId, agencyName, planType]
      );
      user = result.rows[0];
      await client.query(
        "INSERT INTO password_reset_otps (id, user_id, code_digest, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes')",
        [challengeId, user.id, digestOtp(challengeId, code)]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    try {
      await sendEmail({ to: user.email, ...createWelcomeInvitationEmail(challengeId, code) });
    } catch (emailError) {
      console.error('Welcome invitation email error:', emailError);
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
      return NextResponse.json({ error: 'No se pudo enviar la invitación. La cuenta no se ha creado; inténtalo de nuevo.' }, { status: 502 });
    }

    return NextResponse.json({ ...serializeUser(user), invitationExpiresInMinutes: OTP_TTL_MINUTES }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }
    console.error('Create user invitation error:', error);
    return NextResponse.json({ error: 'No se pudo crear el usuario ni enviar la invitación' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = (await request.json()) as {
      ids?: unknown;
      action?: unknown;
      role?: unknown;
      tenantId?: unknown;
      agencyName?: unknown;
      planType?: unknown;
    };
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : [];
    if (ids.length === 0 || ids.length > 100 || ids.some((id) => !Number.isInteger(id) || (id as number) < 1)) {
      return NextResponse.json({ error: 'Selecciona entre 1 y 100 usuarios válidos' }, { status: 400 });
    }

    const action = body.action as BulkAction;
    if (action !== 'activate' && action !== 'deactivate' && action !== 'changeRole' && action !== 'changeTenant') {
      return NextResponse.json({ error: 'La acción masiva no es válida' }, { status: 400 });
    }

    if ((action === 'deactivate' || (action === 'changeRole' && body.role !== admin.role)) && ids.includes(admin.userId)) {
      return NextResponse.json({ error: 'No puedes alterar tus propios permisos o desactivar tu cuenta' }, { status: 400 });
    }

    if (action === 'changeRole') {
      if (!isUserRole(body.role)) {
        return NextResponse.json({ error: 'El rol indicado no es válido' }, { status: 400 });
      }
      if ((body.role === 'superadmin' || body.role === 'superuser') && admin.role !== 'superadmin' && admin.role !== 'superuser') {
        return NextResponse.json({ error: 'Solo un superusuario puede otorgar rol de superadministrador' }, { status: 403 });
      }
      await pool.query('UPDATE users SET role = $1 WHERE id = ANY($2::int[])', [body.role, ids]);
    } else if (action === 'changeTenant') {
      if (admin.role !== 'superadmin' && admin.role !== 'superuser') {
        return NextResponse.json({ error: 'Solo un superusuario puede reasignar agencias en bloque' }, { status: 403 });
      }
      const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : 'particular';
      const agencyName = typeof body.agencyName === 'string' ? body.agencyName.trim() : 'Particular';
      const planType = typeof body.planType === 'string' ? body.planType.trim() : (tenantId === 'particular' ? 'particular' : 'agency_starter');

      await pool.query(
        'UPDATE users SET tenant_id = $1, agency_name = $2, plan_type = $3 WHERE id = ANY($4::int[])',
        [tenantId, agencyName, planType, ids]
      );
    } else {
      await pool.query('UPDATE users SET is_active = $1 WHERE id = ANY($2::int[])', [action === 'activate', ids]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update users error:', error);
    return NextResponse.json({ error: 'No se pudieron actualizar los usuarios' }, { status: 500 });
  }
}
