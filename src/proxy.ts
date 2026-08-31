import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

async function getCryptoKey(): Promise<CryptoKey | null> {
  if (!JWT_SECRET) return null;
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

async function verifySession(token: string): Promise<boolean> {
  try {
    const [b64Data, signatureHex, extraPart] = token.split('.');
    if (!b64Data || !signatureHex || extraPart) return false;

    const data = decodeURIComponent(escape(atob(b64Data)));
    const parsed = JSON.parse(data) as { expiresAt?: unknown };
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) return false;

    const hexMatch = signatureHex.match(/.{1,2}/g);
    const key = await getCryptoKey();
    if (!hexMatch || !key || hexMatch.some((byte) => !/^[0-9a-f]{2}$/i.test(byte))) return false;

    return crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(hexMatch.map((byte) => parseInt(byte, 16))),
      new TextEncoder().encode(data)
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSessionValid = await verifySession(request.cookies.get('travel_session')?.value ?? '');

  if (pathname === '/login') {
    return isSessionValid ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  }

  if (pathname === '/' || pathname.startsWith('/viaje') || pathname.startsWith('/admin') || pathname.startsWith('/api/trips') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/assistant')) {
    if (!isSessionValid) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.webp|.*\\.svg).*)'],
};
