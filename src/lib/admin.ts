import 'server-only';

import { NextResponse } from 'next/server';
import { getAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth';

export async function requireAdmin(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos de administración' }, { status: 403 });
  }
  return user;
}
