import { NextResponse } from 'next/server';
import { initDb, pool } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type PublicTripRow = {
  id: string;
  user_id: number;
  name: string;
  start_date: string;
  end_date: string;
  budget?: number | string | null;
  image_url: string | null;
  description: string | null;
  public_show_expenses: boolean;
  public_itinerary_visibility: 'all' | 'day_before';
  reminder_enabled?: boolean;
  itinerary_access_enabled?: boolean;
  itinerary_access_hours?: number;
  public_access_enabled?: boolean;
};

type PublicActivityRow = {
  id: string;
  type: string;
  date: string;
  time: string;
  price: string;
  details: Record<string, unknown>;
};

function tripStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getTripCode(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  let n = Math.abs(hash) + 12345678;
  for (let i = 0; i < 10; i++) {
    result += chars[n % chars.length];
    n = Math.floor(n / chars.length) + (i * 7 + 11);
  }
  return result;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    await initDb();
    const tripResult = await pool.query<PublicTripRow>(
      `SELECT
        t.id,
        t.user_id,
        t.name,
        t.start_date,
        t.end_date,
        t.budget,
        t.image_url,
        t.description,
        s.reminder_enabled,
        s.itinerary_access_enabled,
        s.itinerary_access_hours,
        s.public_access_enabled,
        COALESCE(s.public_show_expenses, TRUE) as public_show_expenses,
        COALESCE(s.public_itinerary_visibility, 'all') as public_itinerary_visibility
      FROM trips t
      LEFT JOIN trip_notification_settings s ON t.id = s.trip_id
      WHERE s.public_access_token = $1 OR t.id = $1 OR t.id LIKE '%' || $1 || '%'`,
      [token]
    );

    let trip: PublicTripRow | undefined = tripResult.rows[0];

    // Fallback: match by human-readable deterministic tripCode (e.g. ZBK6J6SY7E)
    if (!trip) {
      const allTripsResult = await pool.query<PublicTripRow>(
        `SELECT
          t.id,
          t.user_id,
          t.name,
          t.start_date,
          t.end_date,
          t.budget,
          t.image_url,
          t.description,
          s.reminder_enabled,
          s.itinerary_access_enabled,
          s.itinerary_access_hours,
          s.public_access_enabled,
          COALESCE(s.public_show_expenses, TRUE) as public_show_expenses,
          COALESCE(s.public_itinerary_visibility, 'all') as public_itinerary_visibility
        FROM trips t
        LEFT JOIN trip_notification_settings s ON t.id = s.trip_id`
      );

      trip = allTripsResult.rows.find((row) => {
        const code = getTripCode(row.id);
        return (
          code.toUpperCase() === token.toUpperCase() ||
          row.id.toLowerCase() === token.toLowerCase() ||
          row.id.toLowerCase().includes(token.toLowerCase())
        );
      });
    }

    if (!trip) {
      return NextResponse.json({ error: 'Este enlace no está disponible o el viaje no existe.' }, { status: 404 });
    }

    // Check if user is authenticated (owner or admin) to always allow previewing
    const session = await getAuthenticatedUser().catch(() => null);
    const url = new URL(_request.url);
    const isPreview = url.searchParams.get('preview') === 'true' || url.searchParams.get('preview') === '1';
    const isOwnerOrAdmin = Boolean(session && (session.role === 'admin' || session.userId === trip.user_id));

    // Lock condition: ONLY lock if itinerary access restriction is explicitly ENABLED,
    // reminder is enabled, and public visibility is set to 'day_before'
    const isRestrictedBySettings =
      trip.public_itinerary_visibility === 'day_before' &&
      trip.itinerary_access_enabled === true &&
      trip.reminder_enabled === true;

    const accessHours = Number(trip.itinerary_access_hours) || 24;
    const availableAt = new Date(tripStart(trip.start_date).getTime() - accessHours * 60 * 60 * 1000);
    const isLocked = !isOwnerOrAdmin && !isPreview && isRestrictedBySettings && Date.now() < availableAt.getTime();

    if (isLocked) {
      return NextResponse.json({
        available: false,
        availableAt: availableAt.toISOString(),
      });
    }

    const activityResult = await pool.query<PublicActivityRow>(
      'SELECT id, type, date, time, price, details FROM activities WHERE trip_id = $1 ORDER BY date ASC, time ASC',
      [trip.id]
    );

    const activities = activityResult.rows.map((activity) => ({
      id: activity.id,
      type: activity.type,
      date: activity.date,
      time: activity.time,
      ...(trip.public_show_expenses ? { price: Number(activity.price) } : {}),
      ...activity.details,
    }));

    const userResult = await pool.query<{ role: string; tenant_id: string | null; agency_name: string | null; preferences: Record<string, unknown> }>(
      'SELECT role, tenant_id, agency_name, preferences FROM users WHERE id = $1',
      [trip.user_id]
    );
    const userRow = userResult.rows[0];
    const userPrefs = (userRow?.preferences as Record<string, any>) || {};
    const isAgency = Boolean(
      userRow?.role === 'admin' ||
      userRow?.role === 'superadmin' ||
      userRow?.role === 'superuser' ||
      (userRow?.tenant_id && userRow?.tenant_id !== 'particular')
    );
    const agencyLogo = userPrefs.agencyLogo ? userPrefs.agencyLogo : null;
    const agencyName = userRow?.agency_name || null;

    const paymentProviders = {
      redsys: userPrefs.paymentProviders?.redsys?.connected !== false,
      stripe: Boolean(userPrefs.paymentProviders?.stripe?.connected),
      inespay: Boolean(userPrefs.paymentProviders?.inespay?.connected),
    };

    return NextResponse.json({
      available: true,
      trip: {
        name: trip.name,
        startDate: trip.start_date,
        endDate: trip.end_date,
        budget: trip.budget ? Number(trip.budget) : 0,
        imageUrl: trip.image_url,
        description: trip.description,
        showExpenses: trip.public_show_expenses,
        paymentProviders,
        activities,
        agencyLogo,
        agencyName,
      },
    });
  } catch (error) {
    console.error('Fetch public trip error:', error);
    return NextResponse.json({ error: 'No se ha podido cargar el itinerario' }, { status: 500 });
  }
}
