import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { type UserRole } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 12;

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'user';
}

export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Usuario no válido' }, { status: 400 });
  }

  try {
    const body = await request.json() as { email?: unknown; password?: unknown; role?: unknown; isActive?: unknown };
    const assignments: string[] = [];
    const values: unknown[] = [];

    if (body.email !== undefined) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!EMAIL_PATTERN.test(email) || email.length > 255) {
        return NextResponse.json({ error: 'Introduce un correo electrónico válido' }, { status: 400 });
      }
      assignments.push(`email = $${values.length + 1}`);
      values.push(email);
    }
    if (body.password !== undefined) {
      if (typeof body.password !== 'string' || body.password.length < PASSWORD_MIN_LENGTH || body.password.length > 128) {
        return NextResponse.json({ error: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y 128 caracteres` }, { status: 400 });
      }
      assignments.push(`password = $${values.length + 1}`);
      values.push(await bcryptjs.hash(body.password, 12));
    }
    if (body.role !== undefined) {
      if (!isUserRole(body.role)) {
        return NextResponse.json({ error: 'El rol indicado no es válido' }, { status: 400 });
      }
      if (id === admin.userId && body.role !== 'admin') {
        return NextResponse.json({ error: 'No puedes retirar tus propios permisos de administrador' }, { status: 400 });
      }
      assignments.push(`role = $${values.length + 1}`);
      values.push(body.role);
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'El estado indicado no es válido' }, { status: 400 });
      }
      if (id === admin.userId && !body.isActive) {
        return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
      }
      assignments.push(`is_active = $${values.length + 1}`);
      values.push(body.isActive);
    }

    if (assignments.length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400 });
    }

    values.push(id);
    const result = await pool.query<{
      id: number;
      email: string;
      role: UserRole;
      is_active: boolean;
      created_at: string;
      trip_count: string;
    }>(
      `WITH updated AS (
        UPDATE users SET ${assignments.join(', ')} WHERE id = $${values.length}
        RETURNING id, email, role, is_active, created_at
       )
       SELECT updated.*, COUNT(trips.id)::text AS trip_count
       FROM updated LEFT JOIN trips ON trips.user_id = updated.id
       GROUP BY updated.id, updated.email, updated.role, updated.is_active, updated.created_at`,
      values
    );
    const user = result.rows[0];
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      tripCount: Number(user.trip_count),
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el usuario' }, { status: 500 });
  }
}


export async function DELETE(_request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Usuario no válido' }, { status: 400 });
  }
  if (id === admin.userId) {
    return NextResponse.json({ error: 'No puedes borrar tu propia cuenta' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const activeAdmins = await client.query<{ id: number }>("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE FOR UPDATE");
    const targetResult = await client.query<{ id: number; role: UserRole; is_active: boolean }>('SELECT id, role, is_active FROM users WHERE id = $1 FOR UPDATE', [id]);
    const target = targetResult.rows[0];
    if (!target) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    if (target.role === 'admin' && target.is_active && activeAdmins.rows.length <= 1) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Debe permanecer al menos un administrador activo' }, { status: 409 });
    }

    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    return NextResponse.json({ success: true, id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'No se pudo borrar el usuario' }, { status: 500 });
  } finally {
    client.release();
  }
}
