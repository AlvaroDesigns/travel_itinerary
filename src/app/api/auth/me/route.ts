import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb(); // Auto-initialize DB on app load / auth verification check
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }
    
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        userId: session.userId,
        email: session.email
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ isAuthenticated: false, error: 'Error de verificación' });
  }
}
