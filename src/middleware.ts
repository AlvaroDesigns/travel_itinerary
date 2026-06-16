import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'travel_itinerary_super_secret_key_2026_alvarodesigns';

// Convert string key to CryptoKey in Edge environment
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Inline session verification for the middleware (must be self-contained for the Edge environment)
async function verifySession(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    
    const [b64Data, signatureHex] = parts;
    const data = decodeURIComponent(escape(atob(b64Data)));
    const parsed = JSON.parse(data);
    
    if (parsed.expiresAt < Date.now()) {
      return false; // Expired
    }
    
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const hexMatch = signatureHex.match(/.{1,2}/g);
    if (!hexMatch) return false;
    const signatureBytes = new Uint8Array(
      hexMatch.map(byte => parseInt(byte, 16))
    );
    
    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encodedData);
    
    return isValid;
  } catch (e) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('travel_session')?.value;
  
  const isSessionValid = token ? await verifySession(token) : false;

  // 1. User is on login page
  if (pathname === '/login') {
    if (isSessionValid) {
      // Redirect to home if already logged in
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. User is on protected pages or API routes
  if (pathname === '/' || pathname.startsWith('/viaje') || pathname.startsWith('/api/trips')) {
    if (!isSessionValid) {
      // Redirect to login if not authenticated
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.webp|.*\\.svg).*)',
  ],
};
