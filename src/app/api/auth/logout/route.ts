import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('travel_session');
    
    return NextResponse.json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
