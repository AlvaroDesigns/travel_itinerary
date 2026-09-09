import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { type UserRole } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 12;

function isUserRole(value: unknown): value is UserRole {
  return value === 'superuser' || value === 'superadmin' || value === 'admin' || value === 'user';
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
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      password?: unknown;
      role?: unknown;
      isActive?: unknown;
      tenantId?: unknown;
      agencyName?: unknown;
      planType?: unknown;
    };
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
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      assignments.push(`name = $${values.length + 1}`);
      values.push(name);
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
      if ((body.role === 'superadmin' || body.role === 'superuser') && admin.role !== 'superadmin' && admin.role !== 'superuser') {
        return NextResponse.json({ error: 'Solo un superusuario puede otorgar este rol' }, { status: 403 });
      }
      if (id === admin.userId && body.role !== admin.role) {
        return NextResponse.json({ error: 'No puedes alterar tus propios permisos' }, { status: 400 });
      }
      assignments.push(`role = $${values.length + 1}`);
      values.push(body.role);
    }
    if (body.tenantId !== undefined) {
      if (admin.role !== 'superadmin' && admin.role !== 'superuser') {
        return NextResponse.json({ error: 'Solo un superusuario puede cambiar la agencia de un usuario' }, { status: 403 });
      }
      const tenantId = typeof body.tenantId === 'string' && body.tenantId.trim() ? body.tenantId.trim() : 'particular';
      assignments.push(`tenant_id = $${values.length + 1}`);
      values.push(tenantId);
    }
    if (body.agencyName !== undefined) {
      const agencyName = typeof body.agencyName === 'string' && body.agencyName.trim() ? body.agencyName.trim() : 'Particular';
      assignments.push(`agency_name = $${values.length + 1}`);
      values.push(agencyName);
    }
    if (body.planType !== undefined) {
      const planType = typeof body.planType === 'string' && body.planType.trim() ? body.planType.trim() : 'particular';
      assignments.push(`plan_type = $${values.length + 1}`);
      values.push(planType);
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
      return NextResponse.json({ error: 'No se han especificado cambios' }, { status: 400 });
    }

    values.push(id);
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
    }>(
      `UPDATE users SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING id, email, name, role, is_active, tenant_id, agency_name, plan_type, created_at`,
      values
    );

    const updated = result.rows[0];
    if (!updated) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name ?? '',
      role: updated.role,
      isActive: updated.is_active,
      tenantId: updated.tenant_id,
      agencyName: updated.agency_name,
      planType: updated.plan_type,
      createdAt: updated.created_at,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo electrónico' }, { status: 409 });
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
    const activeSuperAdmins = await client.query<{ id: number }>(
      "SELECT id FROM users WHERE (role = 'superuser' OR role = 'superadmin' OR role = 'admin') AND is_active = TRUE FOR UPDATE"
    );
    const targetResult = await client.query<{ id: number; role: UserRole; is_active: boolean }>(
      'SELECT id, role, is_active FROM users WHERE id = $1 FOR UPDATE',
      [id]
    );
    const target = targetResult.rows[0];
    if (!target) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    if ((target.role === 'admin' || target.role === 'superadmin' || target.role === 'superuser') && target.is_active && activeSuperAdmins.rows.length <= 1) {
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
