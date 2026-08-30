import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initDb, pool } from '@/lib/db';
import { createTravelEmail, decoyCountdownValue, isEmailServiceConfigured, sendEmail, surpriseCountdownMessage } from '@/lib/email';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type TestEmailType = 'countdown' | 'instructions' | 'itinerary';

function isTestEmailType(value: unknown): value is TestEmailType {
  return value === 'countdown' || value === 'instructions' || value === 'itinerary';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    await initDb();
    const tripResult = await pool.query<{
      name: string;
      start_date: string;
      public_access_enabled: boolean | null;
      public_access_token: string | null;
    }>(
      `SELECT t.name, t.start_date, s.public_access_enabled, s.public_access_token
       FROM trips t
       LEFT JOIN trip_notification_settings s ON s.trip_id = t.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, session.userId]
    );
    const trip = tripResult.rows[0];
    if (!trip) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });

    const body = await request.json() as { recipientEmail?: string; testType?: unknown; instructionsText?: string; reminderIntervalDays?: number; countdownMode?: unknown };
    const recipientEmail = body.recipientEmail?.trim() ?? '';
    if (!EMAIL_PATTERN.test(recipientEmail)) {
      return NextResponse.json({ error: 'Introduce un email destinatario válido antes de enviar la prueba' }, { status: 400 });
    }
    if (!isTestEmailType(body.testType)) {
      return NextResponse.json({ error: 'Selecciona un tipo de email de prueba válido' }, { status: 400 });
    }
    if (!isEmailServiceConfigured()) {
      return NextResponse.json({ error: 'Faltan RESEND_API_KEY o EMAIL_FROM en el entorno' }, { status: 503 });
    }

    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const instructions = body.instructionsText?.trim() || 'Prepara el equipaje, lleva tu documentación y revisa los detalles importantes antes de salir.';
    const reminderIntervalDays = body.reminderIntervalDays ?? 7;
    if (!Number.isInteger(reminderIntervalDays) || reminderIntervalDays < 1 || reminderIntervalDays > 365) {
      return NextResponse.json({ error: 'La frecuencia debe estar entre 1 y 365 días' }, { status: 400 });
    }
    const isSurprise = body.countdownMode === 'surprise';
    const countdownValue = `Faltan ${reminderIntervalDays} ${reminderIntervalDays === 1 ? 'día' : 'días'}`;
    const itineraryUrl = trip.public_access_enabled && trip.public_access_token
      ? `${appUrl}/publico/${encodeURIComponent(trip.public_access_token)}`
      : `${appUrl}/viaje/${encodeURIComponent(id)}`;
    const templates = {
      countdown: {
        subject: 'Prueba · Tu aventura se acerca',
        html: createTravelEmail({
          preheader: 'Así se verá el recordatorio de cuenta atrás.',
          eyebrow: 'Prueba · Cuenta atrás',
          title: 'Tu aventura se acerca',
          intro: isSurprise
            ? surpriseCountdownMessage()
            : 'Esta vista previa no revela el destino.',
          highlight: {
            label: 'Cuenta atrás',
            value: isSurprise ? decoyCountdownValue() : countdownValue,
          },
          highlightStyle: 'minimal',
        }),
      },
      instructions: {
        subject: 'Prueba · Instrucciones para tu salida',
        html: createTravelEmail({
          preheader: 'Así se verán las instrucciones previas al viaje.',
          eyebrow: 'Prueba · 24 horas antes',
          title: 'Todo listo para salir',
          intro: 'Esta es una vista previa del email de instrucciones que se enviará antes del viaje.',
          highlight: { label: 'Instrucciones', value: instructions },
          highlightStyle: 'minimal',
        }),
      },
      itinerary: {
        subject: `Prueba · ¿Quieres descubrir el plan?`,
        html: createTravelEmail({
          preheader: 'Así se verá la invitación al itinerario.',
          eyebrow: 'Prueba · Acceso al itinerario',
          title: 'Ya puedes descubrir el plan',
          intro: 'Esta es una vista previa del email que invita a consultar todos los detalles del viaje.',
          highlight: { label: 'Acceso disponible', value: 'Tu itinerario está listo' },
          cta: { label: 'Ver el itinerario', url: itineraryUrl },
        }),
      },
    } satisfies Record<TestEmailType, { subject: string; html: string }>;

    const template = templates[body.testType];
    await sendEmail({ to: recipientEmail, subject: template.subject, html: template.html });

    return NextResponse.json({ success: true, recipientEmail, testType: body.testType });
  } catch (error) {
    console.error('Send test email error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message.startsWith('Resend respondió con')) {
      const resendDetail = message.replace(/^Resend respondió con \d+:\s*/, '').slice(0, 500);
      return NextResponse.json({ error: `Resend rechazó el envío de prueba: ${resendDetail}` }, { status: 502 });
    }
    if (message === 'El servicio de email no está configurado') {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'No se pudo enviar el email de prueba' }, { status: 500 });
  }
}
