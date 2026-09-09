import 'server-only';

import { cookies } from 'next/headers';
import { initDb, pool } from '@/lib/db';

export type UserRole = 'superuser' | 'superadmin' | 'admin' | 'user';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  tenantId?: string;
  agencyName?: string;
  planType?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }
  return secret;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getJwtSecret());
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(payload: { userId: number; email: string }): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const data = JSON.stringify({ ...payload, expiresAt });
  const encodedData = new TextEncoder().encode(data);
  const signatureBuffer = await crypto.subtle.sign('HMAC', await getCryptoKey(), encodedData);
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${btoa(unescape(encodeURIComponent(data)))}.${signatureHex}`;
}

export async function verifySession(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const [b64Data, signatureHex, extraPart] = token.split('.');
    if (!b64Data || !signatureHex || extraPart) return null;

    const data = decodeURIComponent(escape(atob(b64Data)));
    const parsed = JSON.parse(data) as { userId?: unknown; email?: unknown; expiresAt?: unknown };
    const userId = parsed.userId;
    const email = parsed.email;
    const expiresAt = parsed.expiresAt;
    if (typeof userId !== 'number' || !Number.isInteger(userId) || typeof email !== 'string' || typeof expiresAt !== 'number' || expiresAt < Date.now()) {
      return null;
    }

    const hexMatch = signatureHex.match(/.{1,2}/g);
    if (!hexMatch || hexMatch.some((byte) => !/^[0-9a-f]{2}$/i.test(byte))) return null;

    const isValid = await crypto.subtle.verify(
      'HMAC',
      await getCryptoKey(),
      new Uint8Array(hexMatch.map((byte) => parseInt(byte, 16))),
      new TextEncoder().encode(data)
    );

    return isValid ? { userId, email } : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = (await cookies()).get('travel_session')?.value;
  return token ? verifySession(token) : null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  await initDb();
  const session = await getSession();
  if (!session) return null;

  const result = await pool.query<{
    id: number;
    email: string;
    role: UserRole;
    name: string | null;
    is_active: boolean;
    tenant_id: string | null;
    agency_name: string | null;
    plan_type: string | null;
    preferences: Record<string, unknown> | null;
  }>('SELECT id, email, role, name, is_active, tenant_id, agency_name, plan_type, preferences FROM users WHERE id = $1', [session.userId]);
  const user = result.rows[0];

  if (!user || !user.is_active || (user.role !== 'superuser' && user.role !== 'superadmin' && user.role !== 'admin' && user.role !== 'user')) return null;
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name || undefined,
    avatar: (user.preferences?.avatar as string) || 'traveler-girl-teal',
    tenantId: user.tenant_id || undefined,
    agencyName: user.agency_name || undefined,
    planType: user.plan_type || undefined,
  };
}
