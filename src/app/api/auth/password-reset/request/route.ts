import { NextResponse } from 'next/server';
import { initDb, pool } from '@/lib/db';
import { createPasswordResetOtpEmail, isEmailServiceConfigured, sendEmail } from '@/lib/email';
import { digestOtp, generateOtp, isValidEmail, normalizeEmail, OTP_TTL_MINUTES } from '@/lib/password-reset';

export const runtime = 'nodejs';
const response = { message: 'Si existe una cuenta activa con ese correo, recibirás un código de recuperación.' };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown };
    const email = normalizeEmail(body.email);
    if (!isValidEmail(email)) return NextResponse.json({ ...response, challengeId: crypto.randomUUID() }, { status: 202 });
    if (!isEmailServiceConfigured()) return NextResponse.json({ error: 'La recuperación por correo no está disponible ahora mismo' }, { status: 503 });
    await initDb();
    const userResult = await pool.query<{ id: number; email: string }>('SELECT id, email FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ ...response, challengeId: crypto.randomUUID() }, { status: 202 });
    const recent = await pool.query('SELECT id FROM password_reset_otps WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL \'60 seconds\' ORDER BY created_at DESC LIMIT 1', [user.id]);
    if (recent.rows[0]) return NextResponse.json({ ...response, challengeId: crypto.randomUUID() }, { status: 202 });
    const challengeId = crypto.randomUUID(); const code = generateOtp();
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query('UPDATE password_reset_otps SET invalidated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND consumed_at IS NULL AND invalidated_at IS NULL', [user.id]); await client.query('INSERT INTO password_reset_otps (id, user_id, code_digest, expires_at) VALUES ($1,$2,$3,CURRENT_TIMESTAMP + INTERVAL \'10 minutes\')', [challengeId, user.id, digestOtp(challengeId, code)]); await client.query('COMMIT'); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    try { const emailContent = createPasswordResetOtpEmail(code); await sendEmail({ to: user.email, ...emailContent }); } catch { await pool.query('UPDATE password_reset_otps SET invalidated_at = CURRENT_TIMESTAMP WHERE id = $1', [challengeId]); }
    return NextResponse.json({ ...response, challengeId, expiresInMinutes: OTP_TTL_MINUTES }, { status: 202 });
  } catch (error) { console.error('Password reset request error:', error); return NextResponse.json({ error: 'No se pudo iniciar la recuperación' }, { status: 500 }); }
}
