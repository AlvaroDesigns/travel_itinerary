import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export async function PUT(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [session.userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const currentHash = userRes.rows[0].password;
    if (currentPassword) {
      const isValid = await bcryptjs.compare(currentPassword, currentHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'La contraseña actual no es correcta' },
          { status: 400 }
        );
      }
    }

    const newHash = await bcryptjs.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, session.userId]);

    return NextResponse.json({ success: true, message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Error al actualizar contraseña' }, { status: 500 });
  }
}
