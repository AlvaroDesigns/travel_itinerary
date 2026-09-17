import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { signSession } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const stateRaw = reqUrl.searchParams.get('state');
  const errorParam = reqUrl.searchParams.get('error');

  if (errorParam || !code) {
    return NextResponse.redirect(new URL('/login?error=google_cancelled', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));
  }

  try {
    let stateData: { userType?: string; from?: string; redirect?: string } = {};
    if (stateRaw) {
      try {
        stateData = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf-8'));
      } catch {
        // Ignore parse error
      }
    }

    const baseUrl = getBaseUrl(request, reqUrl);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    // 2. Fetch User Profile Info from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userinfoResponse.json();

    if (!userinfoResponse.ok || !googleUser.email) {
      console.error('Google userinfo error:', googleUser);
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url));
    }

    await initDb();
    const cleanEmail = googleUser.email.toLowerCase().trim();
    const googleId = googleUser.id;
    const name = googleUser.name || googleUser.given_name || 'Usuario';
    const avatarUrl = googleUser.picture || '';

    // 3. Find or Create User in DB
    let userRes = await pool.query<{
      id: number;
      email: string;
      role: 'superuser' | 'superadmin' | 'admin' | 'user';
      is_active: boolean;
    }>('SELECT id, email, role, is_active FROM users WHERE email = $1', [cleanEmail]);

    let user = userRes.rows[0];

    if (user) {
      // Update google_id and avatar if missing
      await pool.query(
        'UPDATE users SET google_id = COALESCE(NULLIF(google_id, \'\'), $1), avatar_url = COALESCE(NULLIF(avatar_url, \'\'), $2) WHERE id = $3',
        [googleId, avatarUrl, user.id]
      );
    } else {
      // Create new user
      const isAgency = stateData.userType === 'agency';
      const randomPassword = await bcryptjs.hash(Math.random().toString(36) + Date.now().toString(), 12);
      const agencyName = isAgency ? `${name} Travel` : 'Particular';
      const tenantId = isAgency ? slugify(agencyName) : 'particular';
      const role = isAgency ? 'admin' : 'user';
      const planType = isAgency ? 'agency_free' : 'particular';

      const insertRes = await pool.query<{
        id: number;
        email: string;
        role: 'superuser' | 'superadmin' | 'admin' | 'user';
        is_active: boolean;
      }>(
        `INSERT INTO users (email, password, role, name, tenant_id, agency_name, plan_type, is_active, google_id, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9)
         RETURNING id, email, role, is_active`,
        [cleanEmail, randomPassword, role, name, tenantId, agencyName, planType, googleId, avatarUrl]
      );

      user = insertRes.rows[0];
    }

    if (!user.is_active) {
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
    }

    // 4. Issue session cookie and redirect to dashboard
    const token = await signSession({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set('travel_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    const destination = stateData.redirect && stateData.redirect.startsWith('/') ? stateData.redirect : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
