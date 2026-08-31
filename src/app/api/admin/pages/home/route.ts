import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { pool } from '@/lib/db';

const DEFAULT_HOME_CONTENT = {
  heroBadge: 'Tu compañero de aventuras',
  heroTitle: 'Planifica cada viaje\ncon intención.',
  heroDescription: 'Organiza vuelos, traslados, alojamiento y actividades día a día en una interfaz limpia, minimalista y sin distracciones.',
};

type HomeContent = typeof DEFAULT_HOME_CONTENT;

function isHomeContent(value: unknown): value is HomeContent {
  if (!value || typeof value !== 'object') return false;
  const content = value as Record<string, unknown>;
  return typeof content.heroBadge === 'string'
    && typeof content.heroTitle === 'string'
    && typeof content.heroDescription === 'string';
}

function normalizeContent(value: unknown): HomeContent | null {
  if (!isHomeContent(value)) return null;

  const heroBadge = value.heroBadge.trim();
  const heroTitle = value.heroTitle.trim();
  const heroDescription = value.heroDescription.trim();
  if (!heroBadge || heroBadge.length > 90) return null;
  if (!heroTitle || heroTitle.length > 120) return null;
  if (!heroDescription || heroDescription.length > 600) return null;

  return { heroBadge, heroTitle, heroDescription };
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const result = await pool.query<{ content: unknown; updated_at: string }>(
      "SELECT content, updated_at FROM site_content WHERE content_key = 'home'"
    );
    const row = result.rows[0];
    const content = normalizeContent(row?.content) ?? DEFAULT_HOME_CONTENT;

    return NextResponse.json({ content, updatedAt: row?.updated_at ?? null });
  } catch (error) {
    console.error('Fetch home content error:', error);
    return NextResponse.json({ error: 'No se pudo cargar la página de inicio' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json() as { content?: unknown };
    const content = normalizeContent(body.content);
    if (!content) {
      return NextResponse.json({ error: 'Revisa los campos: el pre-título, título y descripción son obligatorios y tienen una longitud máxima.' }, { status: 400 });
    }

    const result = await pool.query<{ content: unknown; updated_at: string }>(
      `INSERT INTO site_content (content_key, content, updated_by)
       VALUES ('home', $1::jsonb, $2)
       ON CONFLICT (content_key) DO UPDATE SET
         content = EXCLUDED.content,
         updated_by = EXCLUDED.updated_by,
         updated_at = CURRENT_TIMESTAMP
       RETURNING content, updated_at`,
      [JSON.stringify(content), admin.userId]
    );

    return NextResponse.json({ content: result.rows[0].content, updatedAt: result.rows[0].updated_at });
  } catch (error) {
    console.error('Update home content error:', error);
    return NextResponse.json({ error: 'No se pudo guardar la página de inicio' }, { status: 500 });
  }
}
