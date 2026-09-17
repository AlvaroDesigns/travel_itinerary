import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { signSession } from '@/lib/auth';

function getBaseUrl(request: Request, reqUrl: URL) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || reqUrl.host;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  if (isLocal) {
    return `http://${host}`;
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userType = searchParams.get('type') || 'particular';
  const redirectParam = searchParams.get('redirect') || '/dashboard';
  const reqUrl = new URL(request.url);
  const baseUrl = getBaseUrl(request, reqUrl);

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // If real Google OAuth credentials are provided, redirect to Google OAuth consent screen
  if (clientId) {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const state = JSON.stringify({ userType, from: baseUrl, redirect: redirectParam });
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: Buffer.from(state).toString('base64'),
      });

    return NextResponse.redirect(googleAuthUrl);
  }

  // Seamless Dev / Demo Mode: If GOOGLE_CLIENT_ID is not configured in .env.local yet,
  // sign in with the primary administrator or verified Google profile automatically so it works instantly!
  try {
    await initDb();
    
    // Check if an existing admin or user already exists
    let userRes = await pool.query<{
      id: number;
      email: string;
      role: 'superuser' | 'superadmin' | 'admin' | 'user';
    }>('SELECT id, email, role FROM users WHERE email IN (\'alvaro.bonilla1990@gmail.com\', \'hello@alvarodesigns.com\') ORDER BY id ASC LIMIT 1');

    let user = userRes.rows[0];

    if (!user) {
      const demoGoogleEmail = 'alvaro.bonilla1990@gmail.com';
      const demoGoogleName = 'Alvaro Bonilla';
      const isAgency = userType === 'agency';
      const randomPass = await bcryptjs.hash('GoogleOAuthSecretDemoPass_2026', 12);
      const insertRes = await pool.query<{
        id: number;
        email: string;
        role: 'superuser' | 'superadmin' | 'admin' | 'user';
      }>(
        `INSERT INTO users (email, password, role, name, tenant_id, agency_name, plan_type, is_active, google_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
         RETURNING id, email, role`,
        [
          demoGoogleEmail,
          randomPass,
          'admin',
          demoGoogleName,
          'alvarodesigns',
          'AlvaroDesigns Travel',
          'agency_pro',
          'google_1029384756',
        ]
      );
      user = insertRes.rows[0];
    }

    const token = await signSession({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set('travel_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.redirect(new URL(redirectParam, request.url));
  } catch (error) {
    console.error('Google Auth Demo Error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
  }
}
