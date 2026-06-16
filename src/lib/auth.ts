import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'travel_itinerary_super_secret_key_2026_alvarodesigns';

// Convert string key to CryptoKey using Web Crypto API
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

// Sign payload
export async function signSession(payload: { userId: number; email: string }): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = JSON.stringify({ ...payload, expiresAt });
  
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encodedData);
  
  // Convert signature buffer to hex
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Base64 encode the data payload safely (supporting unicode characters)
  const b64Data = btoa(unescape(encodeURIComponent(data)));
  return `${b64Data}.${signatureHex}`;
}

// Verify session
export async function verifySession(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [b64Data, signatureHex] = parts;
    const data = decodeURIComponent(escape(atob(b64Data)));
    const parsed = JSON.parse(data);
    
    if (parsed.expiresAt < Date.now()) {
      return null; // Expired
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    // Reconstruct signature buffer from hex
    const hexMatch = signatureHex.match(/.{1,2}/g);
    if (!hexMatch) return null;
    const signatureBytes = new Uint8Array(
      hexMatch.map(byte => parseInt(byte, 16))
    );
    
    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encodedData);
    
    if (!isValid) return null;
    
    return { userId: parsed.userId, email: parsed.email };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// NextJS Cookie helper for Server Components / API Routes
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('travel_session')?.value;
  if (!token) return null;
  return await verifySession(token);
}
