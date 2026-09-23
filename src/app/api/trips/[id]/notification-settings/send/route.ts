import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { initDb, pool } from '@/lib/db';
import { createTravelEmail, decoyCountdownValue, isEmailServiceConfigured, sendEmail, surpriseCountdownMessage } from '@/lib/email';
import { normalizeBccEmails } from '@/lib/notification-settings';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type SendEmailType = 'countdown' | 'instructions' | 'itinerary';

function isSendEmailType(value: unknown): value is SendEmailType {
  return value === 'countdown' || value === 'instructions' || value === 'itinerary';
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
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

    const body = await request.json() as {
      recipientEmail?: string;
      bccEmails?: unknown;
      sendType?: unknown;
      instructionsText?: string;
      instructionsHours?: number;
      reminderIntervalDays?: number;
      countdownMode?: unknown;
    };

    const recipientEmail = body.recipientEmail?.trim().toLowerCase() ?? '';
    const bccEmails = normalizeBccEmails(body.bccEmails ?? []);
    if (!EMAIL_PATTERN.test(recipientEmail)) {
      return NextResponse.json({ error: 'Introduce un email destinatario válido antes de enviar' }, { status: 400 });
    }
    if (!bccEmails) {
      return NextResponse.json({ error: 'Las direcciones CCO deben ser emails válidos separados por comas' }, { status: 400 });
    }
    if (!isSendEmailType(body.sendType)) {
      return NextResponse.json({ error: 'Selecciona un tipo de email válido' }, { status: 400 });
    }
    if (!isEmailServiceConfigured()) {
      return NextResponse.json({ error: 'Faltan RESEND_API_KEY o EMAIL_FROM en el entorno' }, { status: 503 });
    }

    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const instructions = body.instructionsText?.trim() || 'Revisa los detalles importantes y prepara todo lo necesario para tu salida.';
    const instructionsHours = Number(body.instructionsHours ?? 24);
    const isSurprise = body.countdownMode === 'surprise';
    const startsAt = new Date(`${trip.start_date}T00:00:00.000Z`);
    const millisecondsUntilTrip = startsAt.getTime() - Date.now();
    const daysUntilDeparture = Math.max(1, Math.ceil(millisecondsUntilTrip / (24 * 60 * 60 * 1000)));
    const countdownValue = `Faltan ${daysUntilDeparture} ${daysUntilDeparture === 1 ? 'día' : 'días'}`;
    const itineraryUrl = trip.public_access_enabled && trip.public_access_token
      ? `${appUrl}/publico/${encodeURIComponent(trip.public_access_token)}`
      : `${appUrl}/viaje/${encodeURIComponent(id)}`;

    const templates: Record<SendEmailType, { subject: string; html: string; timestampCol: string }> = {
      countdown: {
        subject: 'Tu próxima aventura se acerca',
        html: createTravelEmail({
          preheader: 'Tu próxima aventura se acerca.',
          eyebrow: 'Cuenta atrás',
          title: 'Tu aventura se acerca',
          intro: isSurprise ? surpriseCountdownMessage() : 'Cada día queda menos para una experiencia especial.',
          highlight: {
            label: 'Cuenta atrás',
            value: isSurprise ? decoyCountdownValue() : countdownValue,
          },
          highlightStyle: 'minimal',
        }),
        timestampCol: 'last_reminder_sent_at',
      },
      instructions: {
        subject: `Instrucciones para ${trip.name}`,
        html: createTravelEmail({
          preheader: 'Instrucciones para tu salida próxima.',
          eyebrow: `${instructionsHours} horas antes`,
          title: 'Todo listo para salir',
          intro: `Quedan menos de ${instructionsHours} horas para tu salida.`,
          highlight: { label: 'Instrucciones', value: instructions },
          highlightStyle: 'minimal',
        }),
        timestampCol: 'instructions_sent_at',
      },
      itinerary: {
        subject: '¿Quieres descubrir el plan?',
        html: createTravelEmail({
          preheader: 'Tu itinerario ya está disponible.',
          eyebrow: 'Acceso al itinerario',
          title: 'Ya puedes descubrir el plan',
          intro: 'La salida se acerca. Ya puedes consultar todos los detalles del viaje.',
          highlight: { label: 'Acceso disponible', value: 'Tu itinerario está listo' },
          cta: { label: 'Ver el itinerario', url: itineraryUrl },
        }),
        timestampCol: 'itinerary_access_sent_at',
      },
    };

    const targetTemplate = templates[body.sendType];

    await sendEmail({
      to: recipientEmail,
      bcc: bccEmails,
      subject: targetTemplate.subject,
      html: targetTemplate.html,
    });

    // Update sent timestamp in DB if notification settings exist or insert default row
    await pool.query(
      `INSERT INTO trip_notification_settings (trip_id, recipient_email, bcc_emails, ${targetTemplate.timestampCol}, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (trip_id) DO UPDATE SET
         recipient_email = EXCLUDED.recipient_email,
         bcc_emails = EXCLUDED.bcc_emails,
         ${targetTemplate.timestampCol} = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
      [id, recipientEmail, bccEmails]
    );

    return NextResponse.json({
      success: true,
      recipientCount: 1 + bccEmails.length,
      sendType: body.sendType,
    });
  } catch (error) {
    console.error('Send real email notification error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message.startsWith('Resend respondió con')) {
      return NextResponse.json({ error: 'Resend rechazó el envío del email' }, { status: 502 });
    }
    if (message === 'El servicio de email no está configurado') {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 500 });
  }
}
