import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { type UserRole } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 12;

type BulkAction = 'activate' | 'deactivate' | 'changeRole';

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'user';
}

function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= PASSWORD_MIN_LENGTH && password.length <= 128;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const query = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
  const result = await pool.query<{
    id: number;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    trip_count: string;
  }>(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at, COUNT(t.id)::text AS trip_count
     FROM users u
     LEFT JOIN trips t ON t.user_id = u.id
     WHERE ($1 = '' OR LOWER(u.email) LIKE '%' || $1 || '%')
     GROUP BY u.id
     ORDER BY CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END, u.created_at ASC`,
    [query]
  );

  return NextResponse.json(result.rows.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    tripCount: Number(user.trip_count),
  })));
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json() as { email?: unknown; password?: unknown; role?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role ?? 'user';

    if (!EMAIL_PATTERN.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Introduce un correo electrónico válido' }, { status: 400 });
    }
    if (!isValidPassword(body.password)) {
      return NextResponse.json({ error: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y 128 caracteres` }, { status: 400 });
    }
    if (!isUserRole(role)) {
      return NextResponse.json({ error: 'El rol indicado no es válido' }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(body.password, 12);
    const result = await pool.query<{
      id: number;
      email: string;
      role: UserRole;
      is_active: boolean;
      created_at: string;
    }>(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, $3)
       RETURNING id, email, role, is_active, created_at`,
      [email, passwordHash, role]
    );
    const user = result.rows[0];

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      tripCount: 0,
    }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json() as { ids?: unknown; action?: unknown; role?: unknown };
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids)] : [];
    if (ids.length === 0 || ids.length > 100 || ids.some((id) => !Number.isInteger(id) || (id as number) < 1)) {
      return NextResponse.json({ error: 'Selecciona entre 1 y 100 usuarios válidos' }, { status: 400 });
    }

    const action = body.action as BulkAction;
    if (action !== 'activate' && action !== 'deactivate' && action !== 'changeRole') {
      return NextResponse.json({ error: 'La acción masiva no es válida' }, { status: 400 });
    }
    if ((action === 'deactivate' || (action === 'changeRole' && body.role === 'user')) && ids.includes(admin.userId)) {
      return NextResponse.json({ error: 'No puedes retirar tus propios permisos de administrador' }, { status: 400 });
    }

    if (action === 'changeRole') {
      if (!isUserRole(body.role)) {
        return NextResponse.json({ error: 'El rol indicado no es válido' }, { status: 400 });
      }
      await pool.query('UPDATE users SET role = $1 WHERE id = ANY($2::int[])', [body.role, ids]);
    } else {
      await pool.query('UPDATE users SET is_active = $1 WHERE id = ANY($2::int[])', [action === 'activate', ids]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update users error:', error);
    return NextResponse.json({ error: 'No se pudieron actualizar los usuarios' }, { status: 500 });
  }
}
