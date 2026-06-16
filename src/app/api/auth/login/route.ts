import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';
import { initDb, pool } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initDb();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const user = res.rows[0];
    const passwordMatch = await bcryptjs.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Sign session and set cookie
    const token = await signSession({ userId: user.id, email: user.email });
    
    const cookieStore = await cookies();
    cookieStore.set('travel_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
