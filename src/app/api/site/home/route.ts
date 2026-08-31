import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/db';

const DEFAULT_HOME_CONTENT = {
  heroBadge: 'Tu compañero de aventuras',
  heroTitle: 'Planifica cada viaje\ncon intención.',
  heroDescription: 'Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.',
};

function toHomeContent(value: unknown) {
  if (!value || typeof value !== 'object') return DEFAULT_HOME_CONTENT;
  const content = value as Record<string, unknown>;
  if (typeof content.heroBadge !== 'string' || typeof content.heroTitle !== 'string' || typeof content.heroDescription !== 'string') {
    return DEFAULT_HOME_CONTENT;
  }
  return {
    heroBadge: content.heroBadge,
    heroTitle: content.heroTitle,
    heroDescription: content.heroDescription,
  };
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await pool.query<{ content: unknown }>(
      "SELECT content FROM site_content WHERE content_key = 'home'"
    );
    return NextResponse.json({ content: toHomeContent(result.rows[0]?.content) });
  } catch (error) {
    console.error('Fetch public home content error:', error);
    return NextResponse.json({ content: DEFAULT_HOME_CONTENT });
  }
}
