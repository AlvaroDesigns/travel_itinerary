import { NextRequest, NextResponse } from 'next/server';
import { initDb, pool } from '@/lib/db';
import { createTravelEmail, decoyCountdownValue, sendEmail, surpriseCountdownMessage } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ScheduledNotification = {
  trip_id: string;
  trip_name: string;
  start_date: string;
  recipient_email: string;
  bcc_emails: string[];
  reminder_enabled: boolean;
  reminder_interval_days: number;
  reminder_time: string;
  countdown_mode: 'exact' | 'surprise';
  last_reminder_sent_at: string | null;
  instructions_enabled: boolean;
  instructions_text: string;
  instructions_sent_at: string | null;
  itinerary_access_enabled: boolean;
  itinerary_access_hours: number;
  itinerary_access_sent_at: string | null;
  public_access_enabled: boolean;
  public_access_token: string | null;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function startOfTrip(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function runNotifications() {
  await initDb();
  const { rows } = await pool.query<ScheduledNotification>(
    `SELECT
      t.id AS trip_id,
      t.name AS trip_name,
      t.start_date,
      s.recipient_email,
      s.bcc_emails,
      s.reminder_enabled,
      s.reminder_interval_days,
      COALESCE(s.reminder_time, '09:00') AS reminder_time,
      s.countdown_mode,
      s.last_reminder_sent_at,
      s.instructions_enabled,
      s.instructions_text,
      s.instructions_sent_at,
      s.itinerary_access_enabled,
      s.itinerary_access_hours,
      s.itinerary_access_sent_at,
      s.public_access_enabled,
      s.public_access_token
    FROM trip_notification_settings s
    INNER JOIN trips t ON t.id = s.trip_id
    WHERE s.reminder_enabled = TRUE`
  );

  const now = new Date();
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const sent: string[] = [];
  const failed: { tripId: string; kind: string; error: string }[] = [];

  for (const setting of rows) {
    const startsAt = startOfTrip(setting.start_date);
    const millisecondsUntilTrip = startsAt.getTime() - now.getTime();
    if (millisecondsUntilTrip <= 0) continue;

    const send = async (kind: string, subject: string, html: string, sentAtColumn: string) => {
      try {
        await sendEmail({
          to: setting.recipient_email,
          bcc: Array.isArray(setting.bcc_emails) ? setting.bcc_emails : [],
          subject,
          html,
        });
        await pool.query(`UPDATE trip_notification_settings SET ${sentAtColumn} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE trip_id = $1`, [setting.trip_id]);
        sent.push(`${setting.trip_id}:${kind}`);
      } catch (error) {
        console.error(`Unable to send ${kind} for trip ${setting.trip_id}:`, error);
        failed.push({ tripId: setting.trip_id, kind, error: error instanceof Error ? error.message : 'Error desconocido' });
      }
    };

    // Calculate if reminder is due considering time of day (hour and minute) and interval
    const [targetHour, targetMinute] = (setting.reminder_time || '09:00').split(':').map(Number);
    const madridParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const currentHour = Number(madridParts.find((p) => p.type === 'hour')?.value || 0);
    const currentMinute = Number(madridParts.find((p) => p.type === 'minute')?.value || 0);

    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = (isNaN(targetHour) ? 9 : targetHour) * 60 + (isNaN(targetMinute) ? 0 : targetMinute);
    const isPastTargetTime = currentTotalMinutes >= targetTotalMinutes;

    const lastReminderAt = setting.last_reminder_sent_at ? new Date(setting.last_reminder_sent_at).getTime() : 0;
    const daysSinceLastReminder = lastReminderAt ? (now.getTime() - lastReminderAt) / DAY_MS : 999;
    const reminderIsDue = isPastTargetTime && (!lastReminderAt || daysSinceLastReminder >= setting.reminder_interval_days * 0.95);
    if (reminderIsDue) {
      const isExact = setting.countdown_mode === 'exact';
      const daysUntilDeparture = Math.max(1, Math.ceil(millisecondsUntilTrip / DAY_MS));
      await send(
        'recordatorio',
        'Tu próxima aventura se acerca',
        createTravelEmail({
          preheader: 'Tu próxima aventura se acerca.',
          eyebrow: 'Cuenta atrás',
          title: 'Tu aventura se acerca',
          intro: isExact ? 'Cada día queda menos para una experiencia especial.' : surpriseCountdownMessage(),
          highlight: {
            label: 'Cuenta atrás',
            value: isExact ? `Faltan ${daysUntilDeparture} ${daysUntilDeparture === 1 ? 'día' : 'días'}` : decoyCountdownValue(),
          },
          highlightStyle: 'minimal',
        }),
        'last_reminder_sent_at'
      );
    }

    if (setting.instructions_enabled && !setting.instructions_sent_at && millisecondsUntilTrip <= DAY_MS) {
      const instructions = setting.instructions_text.trim() || 'Revisa los detalles importantes y prepara todo lo necesario para tu salida.';
      await send(
        'instrucciones',
        `Instrucciones para ${setting.trip_name}`,
        createTravelEmail({
          preheader: 'Instrucciones para tu salida próxima.',
          eyebrow: '24 horas antes',
          title: 'Todo listo para salir',
          intro: 'Quedan menos de 24 horas para tu salida.',
          highlight: { label: 'Instrucciones', value: instructions },
          highlightStyle: 'minimal',
        }),
        'instructions_sent_at'
      );
    }

    const itineraryLeadTime = setting.itinerary_access_hours * HOUR_MS;
    if (setting.itinerary_access_enabled && !setting.itinerary_access_sent_at && millisecondsUntilTrip <= itineraryLeadTime) {
      const itineraryUrl = setting.public_access_enabled && setting.public_access_token
        ? `${appUrl}/publico/${encodeURIComponent(setting.public_access_token)}`
        : `${appUrl}/viaje/${encodeURIComponent(setting.trip_id)}`;
      await send(
        'acceso-itinerario',
        '¿Quieres descubrir el plan?',
        createTravelEmail({
          preheader: 'Tu itinerario ya está disponible.',
          eyebrow: 'Acceso al itinerario',
          title: 'Ya puedes descubrir el plan',
          intro: 'La salida se acerca. Ya puedes consultar todos los detalles del viaje.',
          highlight: { label: 'Acceso disponible', value: 'Tu itinerario está listo' },
          cta: { label: 'Ver el itinerario', url: itineraryUrl },
        }),
        'itinerary_access_sent_at'
      );
    }
  }

  return { sent, failed };
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const authHeader = request.headers.get('authorization');
  if (secret && authHeader === `Bearer ${secret}`) return true;
  if (isVercelCron) return true;
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

async function handleCron(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: 'El servicio de email no está configurado' }, { status: 503 });
  }

  try {
    return NextResponse.json(await runNotifications());
  } catch (error) {
    console.error('Notification cron error:', error);
    return NextResponse.json({ error: 'Error al procesar las notificaciones' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
