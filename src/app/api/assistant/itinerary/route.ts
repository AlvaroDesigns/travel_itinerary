import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { initDb, pool } from '@/lib/db';

export const runtime = 'nodejs';

export type SuggestedAction = {
  id?: string;
  type: 'food' | 'hotel' | 'excursion' | 'flight' | 'transfer';
  label: string;
  date?: string;
  payload: Record<string, unknown>;
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      tripId?: string;
      message?: string;
      activeDate?: string;
      history?: Array<{ role: 'user' | 'assistant'; text?: string; content?: string }>;
      tripContext?: {
        name?: string;
        startDate?: string;
        endDate?: string;
        budget?: number;
        activities?: unknown[];
      };
    };

    if (
      typeof body.tripId !== 'string' ||
      typeof body.message !== 'string' ||
      body.message.trim().length === 0 ||
      body.message.length > 2000
    ) {
      return NextResponse.json(
        { error: 'Indica una consulta válida para el asistente' },
        { status: 400 }
      );
    }

    const apiKey = process.env.API_AI || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La clave de API (API_AI) no está configurada en las variables de entorno.' },
        { status: 500 }
      );
    }

    await initDb();
    const tripResult = await pool.query<{
      name: string;
      start_date: string;
      end_date: string;
      description: string | null;
      notes: string | null;
    }>(
      'SELECT name, start_date, end_date, description, notes FROM trips WHERE id = $1 AND user_id = $2',
      [body.tripId, user.userId]
    );

    const trip = tripResult.rows[0];
    const tripName = trip?.name || body.tripContext?.name || 'Viaje';
    const startDate = trip?.start_date || body.tripContext?.startDate || '';
    const endDate = trip?.end_date || body.tripContext?.endDate || '';
    const activeDay = body.activeDate || startDate;

    const activitiesResult = await pool.query<{
      date: string;
      time: string;
      type: string;
      details: Record<string, unknown>;
    }>(
      'SELECT date, time, type, details FROM activities WHERE trip_id = $1 ORDER BY date, time',
      [body.tripId]
    );

    const currentActivities =
      activitiesResult.rows.length > 0
        ? activitiesResult.rows
        : body.tripContext?.activities || [];

    const tripDetails = {
      destination: tripName,
      startDate,
      endDate,
      selectedDay: activeDay,
      notes: trip?.notes || '',
      currentActivitiesSummary: currentActivities,
    };

    const systemPrompt = `Eres Wanderlust Agent, el asistente inteligente de viajes de la plataforma Wanderlust.
Tu misión es aconsejar al viajero de forma cercana, elegante, empática y experta en español.

CONTEXTO DEL VIAJE:
${JSON.stringify(tripDetails, null, 2)}

INSTRUCCIONES CLAVE:
1. Responde SIEMPRE en formato JSON válido.
2. Si el usuario pide recomendaciones, planes, comidas, hoteles, excursiones, traslados, vuelos o dice "añadelos a itinerario / puedes añadirlos / ponlos", DEBES incluir cada actividad en el array "suggestedActions" con sus datos completos.
3. NUNCA respondas diciendo que has añadido o preparado actividades sin incluirlas en "suggestedActions".
4. Las fechas de "date" en cada suggestedAction deben estar dentro del rango del viaje (${startDate} a ${endDate}). Si el usuario está en el día ${activeDay}, prioriza esa fecha o distribúyelas adecuadamente.

ESTRUCTURA DEL JSON:
{
  "message": "Tu respuesta conversacional con consejos útiles, contexto y detalles...",
  "suggestedActions": [
    {
      "type": "food", // "food" | "hotel" | "excursion" | "flight" | "transfer"
      "label": "Añadir [Nombre o Plato]",
      "date": "${activeDay}", // YYYY-MM-DD
      "payload": {
        // Para "food": restaurantName, mealType ("dinner"|"lunch"|"breakfast"|"snack"), time ("HH:MM"), price (número en €), description, address
        // Para "hotel": hotelName, address, checkIn ("HH:MM"), checkOut ("HH:MM"), price, description
        // Para "excursion": title, duration (ej "3 horas"), time ("HH:MM"), price, description
        // Para "flight": flightNumber, airline, origin, destination, time, arrivalTime, price
        // Para "transfer": transportType ("train"|"taxi"|"bus"), origin, destination, duration, time, price, description
      }
    }
  ]
}`;

    const conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (Array.isArray(body.history)) {
      body.history.slice(-6).forEach((h) => {
        const text = (h.text || h.content || '').trim();
        if (text) {
          conversationHistory.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: text,
          });
        }
      });
    }

    conversationHistory.push({
      role: 'user',
      content: body.message.trim(),
    });

    // Call Groq API
    let groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: conversationHistory,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    // Fallback to qwen/qwen3.8-27b if needed
    if (!groqResponse.ok) {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: conversationHistory,
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(30000),
      });
    }

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errText);
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = (await groqResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = groqData.choices?.[0]?.message?.content || '{}';
    let parsed: {
      message?: string;
      suggestedActions?: SuggestedAction[];
      suggestedAction?: SuggestedAction;
      proposals?: Array<{
        date?: string;
        time?: string;
        title?: string;
        description?: string;
        duration?: string;
        price?: number;
      }>;
    } = {};

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { message: rawContent };
    }

    // Normalize suggestedActions
    const actions: SuggestedAction[] = [];
    if (Array.isArray(parsed.suggestedActions)) {
      actions.push(...parsed.suggestedActions);
    } else if (parsed.suggestedAction && typeof parsed.suggestedAction === 'object') {
      actions.push(parsed.suggestedAction);
    }

    // Convert proposals into suggestedActions if present
    if (Array.isArray(parsed.proposals) && actions.length === 0) {
      parsed.proposals.forEach((p) => {
        if (p.title) {
          actions.push({
            type: 'excursion',
            label: `Añadir ${p.title}`,
            date: p.date || activeDay,
            payload: {
              title: p.title,
              description: p.description || '',
              duration: p.duration || '2 horas',
              time: p.time || '10:00',
              price: Number(p.price) || 0,
            },
          });
        }
      });
    }

    // Ensure IDs and valid fields
    const finalActions = actions.map((act, index) => ({
      ...act,
      id: act.id || `action-${Date.now()}-${index}`,
      date: act.date || activeDay,
      label: act.label || `Añadir actividad`,
    }));

    return NextResponse.json({
      message: parsed.message || 'He preparado tus recomendaciones para el viaje.',
      suggestedActions: finalActions,
      suggestedAction: finalActions[0] || null,
      proposals: parsed.proposals || [],
    });
  } catch (error) {
    console.error('Itinerary assistant error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo procesar la consulta con el asistente de inteligencia artificial.',
      },
      { status: 500 }
    );
  }
}
