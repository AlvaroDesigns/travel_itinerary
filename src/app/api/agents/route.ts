import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const result = await pool.query<{
      id: number;
      email: string;
      name: string | null;
      role: string;
      tenant_id: string | null;
      agency_name: string | null;
    }>(
      `SELECT id, email, name, role, tenant_id, agency_name
       FROM users
       WHERE is_active = TRUE
       ORDER BY CASE WHEN role = 'superadmin' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END, name ASC, email ASC`
    );

    const agents = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name?.trim() ? row.name.trim() : row.email.split('@')[0],
      role: row.role,
      tenantId: row.tenant_id || 'particular',
      agencyName: row.agency_name || 'Particular',
    }));

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json([], { status: 200 });
  }
}
