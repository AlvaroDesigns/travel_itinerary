import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { initDb, pool } from '@/lib/db';
import {
  createDefaultNotificationSettings,
  normalizeBccEmails,
  type CountdownMode,
  type NotificationSettings,
  type PublicItineraryVisibility,
} from '@/lib/notification-settings';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSettings(row: Record<string, unknown>): NotificationSettings {
  return {
    recipientEmail: String(row.recipient_email),
    bccEmails: Array.isArray(row.bcc_emails)
      ? row.bcc_emails.filter((email): email is string => typeof email === 'string')
      : [],
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderIntervalDays: Number(row.reminder_interval_days),
    reminderTime: String(row.reminder_time || '09:00'),
    countdownMode: row.countdown_mode as CountdownMode,
    instructionsEnabled: Boolean(row.instructions_enabled),
    instructionsText: String(row.instructions_text ?? ''),
    itineraryAccessEnabled: Boolean(row.itinerary_access_enabled),
    itineraryAccessHours: Number(row.itinerary_access_hours),
    publicAccessEnabled: Boolean(row.public_access_enabled),
    ...(typeof row.public_access_token === 'string' ? { publicAccessToken: row.public_access_token } : {}),
    publicShowExpenses: Boolean(row.public_show_expenses),
    publicItineraryVisibility: (row.public_itinerary_visibility || 'all') as PublicItineraryVisibility,
  };
}

async function requireTripOwner(tripId: string, userId: number) {
  const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [tripId, userId]);
  return tripResult.rows.length > 0;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    await initDb();
    if (!(await requireTripOwner(id, session.userId))) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    const result = await pool.query('SELECT * FROM trip_notification_settings WHERE trip_id = $1', [id]);
    const settings = result.rows[0]
      ? toSettings(result.rows[0])
      : createDefaultNotificationSettings(process.env.DEFAULT_NOTIFICATION_RECIPIENT || session.email);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fetch notification settings error:', error);
    return NextResponse.json({ error: 'Error al obtener la configuración de notificaciones' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    await initDb();
    if (!(await requireTripOwner(id, session.userId))) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 });
    }

    const body = await request.json() as Partial<NotificationSettings>;
    const recipientEmail = body.recipientEmail?.trim().toLowerCase() ?? '';
    const bccEmails = normalizeBccEmails(body.bccEmails ?? []);
    const reminderIntervalDays = Number(body.reminderIntervalDays);
    const reminderTime = typeof body.reminderTime === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(body.reminderTime) ? body.reminderTime : '09:00';
    const itineraryAccessHours = Number(body.itineraryAccessHours);
    const countdownMode = body.countdownMode;
    const instructionsText = body.instructionsText?.trim() ?? '';
    const publicItineraryVisibility = body.publicItineraryVisibility;

    if (!EMAIL_PATTERN.test(recipientEmail)) {
      return NextResponse.json({ error: 'Introduce un email destinatario válido' }, { status: 400 });
    }
    if (!bccEmails) {
      return NextResponse.json({ error: 'Las direcciones CCO deben ser emails válidos separados por comas' }, { status: 400 });
    }
    if (!Number.isInteger(reminderIntervalDays) || reminderIntervalDays < 1 || reminderIntervalDays > 365) {
      return NextResponse.json({ error: 'La frecuencia debe estar entre 1 y 365 días' }, { status: 400 });
    }
    if (!Number.isInteger(itineraryAccessHours) || itineraryAccessHours < 1 || itineraryAccessHours > 720) {
      return NextResponse.json({ error: 'Las horas de acceso deben estar entre 1 y 720' }, { status: 400 });
    }
    if (countdownMode !== 'exact' && countdownMode !== 'surprise') {
      return NextResponse.json({ error: 'El modo de cuenta atrás no es válido' }, { status: 400 });
    }
    if (publicItineraryVisibility !== 'all' && publicItineraryVisibility !== 'day_before') {
      return NextResponse.json({ error: 'La visibilidad del itinerario no es válida' }, { status: 400 });
    }
    if (instructionsText.length > 5000) {
      return NextResponse.json({ error: 'Las instrucciones no pueden superar los 5.000 caracteres' }, { status: 400 });
    }

    const publicAccessEnabled = Boolean(body.publicAccessEnabled);
    const existingResult = await pool.query<{ public_access_token: string | null }>(
      'SELECT public_access_token FROM trip_notification_settings WHERE trip_id = $1',
      [id]
    );
    const publicAccessToken = existingResult.rows[0]?.public_access_token || (publicAccessEnabled ? crypto.randomUUID() : null);

    const settings: NotificationSettings = {
      recipientEmail,
      bccEmails,
      reminderEnabled: Boolean(body.reminderEnabled),
      reminderIntervalDays,
      reminderTime,
      countdownMode,
      instructionsEnabled: Boolean(body.instructionsEnabled),
      instructionsText,
      itineraryAccessEnabled: Boolean(body.itineraryAccessEnabled),
      itineraryAccessHours,
      publicAccessEnabled,
      ...(publicAccessToken ? { publicAccessToken } : {}),
      publicShowExpenses: Boolean(body.publicShowExpenses),
      publicItineraryVisibility,
    };

    const result = await pool.query(
      `INSERT INTO trip_notification_settings (
        trip_id, recipient_email, bcc_emails, reminder_enabled, reminder_interval_days, reminder_time, countdown_mode,
        instructions_enabled, instructions_text, itinerary_access_enabled, itinerary_access_hours,
        public_access_enabled, public_access_token, public_show_expenses, public_itinerary_visibility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (trip_id) DO UPDATE SET
        recipient_email = EXCLUDED.recipient_email,
        bcc_emails = EXCLUDED.bcc_emails,
        reminder_enabled = EXCLUDED.reminder_enabled,
        reminder_interval_days = EXCLUDED.reminder_interval_days,
        reminder_time = EXCLUDED.reminder_time,
        countdown_mode = EXCLUDED.countdown_mode,
        instructions_enabled = EXCLUDED.instructions_enabled,
        instructions_text = EXCLUDED.instructions_text,
        itinerary_access_enabled = EXCLUDED.itinerary_access_enabled,
        itinerary_access_hours = EXCLUDED.itinerary_access_hours,
        public_access_enabled = EXCLUDED.public_access_enabled,
        public_access_token = EXCLUDED.public_access_token,
        public_show_expenses = EXCLUDED.public_show_expenses,
        public_itinerary_visibility = EXCLUDED.public_itinerary_visibility,
        last_reminder_sent_at = CASE WHEN trip_notification_settings.reminder_time != EXCLUDED.reminder_time THEN NULL ELSE trip_notification_settings.last_reminder_sent_at END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        id,
        settings.recipientEmail,
        settings.bccEmails,
        settings.reminderEnabled,
        settings.reminderIntervalDays,
        settings.reminderTime,
        settings.countdownMode,
        settings.instructionsEnabled,
        settings.instructionsText,
        settings.itineraryAccessEnabled,
        settings.itineraryAccessHours,
        settings.publicAccessEnabled,
        publicAccessToken,
        settings.publicShowExpenses,
        settings.publicItineraryVisibility,
      ]
    );

    return NextResponse.json(toSettings(result.rows[0]));
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json({ error: 'Error al guardar la configuración de notificaciones' }, { status: 500 });
  }
}
