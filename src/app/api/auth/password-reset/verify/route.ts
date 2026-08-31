import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { digestOtp, OTP_MAX_ATTEMPTS, sameDigest, validPassword } from '@/lib/password-reset';

export const runtime = 'nodejs';
const invalid = () => NextResponse.json({ error: 'El código no es válido, ha caducado o ya fue utilizado' }, { status: 400 });

export async function POST(request: Request) {
  try {
    const body = await request.json() as { challengeId?: unknown; code?: unknown; password?: unknown };
    if (typeof body.challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.challengeId) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return invalid();
    if (!validPassword(body.password)) return NextResponse.json({ error: 'La contraseña debe tener entre 12 y 128 caracteres' }, { status: 400 });
    await initDb(); const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ user_id: number; code_digest: string; expires_at: string; attempt_count: number; consumed_at: string | null; invalidated_at: string | null }>('SELECT user_id, code_digest, expires_at, attempt_count, consumed_at, invalidated_at FROM password_reset_otps WHERE id = $1 FOR UPDATE', [body.challengeId]);
      const otp = result.rows[0];
      if (!otp || otp.consumed_at || otp.invalidated_at || otp.attempt_count >= OTP_MAX_ATTEMPTS || new Date(otp.expires_at) <= new Date()) { await client.query('COMMIT'); return invalid(); }
      if (!sameDigest(otp.code_digest, digestOtp(body.challengeId, body.code))) { await client.query('UPDATE password_reset_otps SET attempt_count = attempt_count + 1, invalidated_at = CASE WHEN attempt_count + 1 >= $2 THEN CURRENT_TIMESTAMP ELSE invalidated_at END WHERE id = $1', [body.challengeId, OTP_MAX_ATTEMPTS]); await client.query('COMMIT'); return invalid(); }
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [await bcryptjs.hash(body.password, 12), otp.user_id]);
      await client.query('UPDATE password_reset_otps SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND consumed_at IS NULL', [otp.user_id]);
      await client.query('COMMIT'); return NextResponse.json({ success: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error) { console.error('Password reset verify error:', error); return NextResponse.json({ error: 'No se pudo restablecer la contraseña' }, { status: 500 }); }
}
