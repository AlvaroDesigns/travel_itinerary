import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { initDb, pool } from '@/lib/db';

export const runtime = 'nodejs';

type Proposal = { date: string; time: string; title: string; description: string; duration: string; price: number };

function isProposal(value: unknown): value is Proposal {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    && typeof item.time === 'string' && /^\d{2}:\d{2}$/.test(item.time)
    && typeof item.title === 'string' && item.title.trim().length > 0
    && typeof item.description === 'string' && typeof item.duration === 'string'
    && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json() as { tripId?: unknown; message?: unknown };
    if (typeof body.tripId !== 'string' || typeof body.message !== 'string' || body.message.trim().length === 0 || body.message.length > 1500) {
      return NextResponse.json({ error: 'Indica una consulta válida para el asistente' }, { status: 400 });
    }

    await initDb();
    const tripResult = await pool.query<{ name: string; start_date: string; end_date: string; description: string | null; notes: string | null }>(
      'SELECT name, start_date, end_date, description, notes FROM trips WHERE id = $1 AND user_id = $2',
      [body.tripId, user.userId]
    );
    const trip = tripResult.rows[0];
    if (!trip) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });

    const activities = await pool.query<{ date: string; time: string; type: string; details: Record<string, unknown> }>(
      'SELECT date, time, type, details FROM activities WHERE trip_id = $1 ORDER BY date, time', [body.tripId]
    );
    const context = JSON.stringify({ trip, activities: activities.rows.map((activity) => ({ ...activity, details: activity.details })) });
    const prompt = `Eres un asistente de viajes útil y conciso. Contesta en español. Usa solo este viaje autorizado: ${context}. Petición: ${body.message.trim()}. Devuelve JSON sin markdown con {"message":"respuesta breve","proposals":[{"date":"YYYY-MM-DD","time":"HH:MM","title":"actividad","description":"detalle útil","duration":"duración","price":0}]}. Las propuestas deben estar entre ${trip.start_date} y ${trip.end_date}. Si no procede crear actividades, usa proposals vacío.`;
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2:3b', prompt, format: 'json', stream: false, options: { temperature: 0.2 } }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error('OLLAMA_UNAVAILABLE');
    const result = await response.json() as { response?: string };
    const parsed = JSON.parse(result.response || '{}') as { message?: unknown; proposals?: unknown };
    const proposals = Array.isArray(parsed.proposals) ? parsed.proposals.filter(isProposal).filter((item) => item.date >= trip.start_date && item.date <= trip.end_date).slice(0, 12) : [];
    return NextResponse.json({ message: typeof parsed.message === 'string' ? parsed.message : 'He preparado una propuesta para tu viaje.', proposals });
  } catch (error) {
    console.error('Itinerary assistant error:', error);
    const unavailable = error instanceof Error && (error.message === 'OLLAMA_UNAVAILABLE' || error.name === 'TimeoutError' || error.name === 'TypeError');
    return NextResponse.json({ error: unavailable ? 'El asistente local no está disponible. Inicia Ollama y descarga el modelo configurado.' : 'No se pudo procesar la consulta del asistente' }, { status: unavailable ? 503 : 500 });
  }
}
