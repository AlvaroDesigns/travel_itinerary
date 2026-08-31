import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }

    return NextResponse.json({ isAuthenticated: true, user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ isAuthenticated: false, error: 'Error de verificación' });
  }
}
