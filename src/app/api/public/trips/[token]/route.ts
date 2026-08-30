import { NextResponse } from 'next/server';
import { initDb, pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PublicTripRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  image_url: string | null;
  description: string | null;
  public_show_expenses: boolean;
  public_itinerary_visibility: 'all' | 'day_before';
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
        t.name,
        t.start_date,
        t.end_date,
        t.image_url,
        t.description,
        s.public_show_expenses,
        s.public_itinerary_visibility
      FROM trip_notification_settings s
      INNER JOIN trips t ON t.id = s.trip_id
      WHERE s.public_access_enabled = TRUE AND s.public_access_token = $1`,
      [token]
    );

    const trip = tripResult.rows[0];
    if (!trip) {
      return NextResponse.json({ error: 'Este enlace no está disponible' }, { status: 404 });
    }

    const availableAt = new Date(tripStart(trip.start_date).getTime() - 24 * 60 * 60 * 1000);
    const isLocked = trip.public_itinerary_visibility === 'day_before' && Date.now() < availableAt.getTime();

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

    return NextResponse.json({
      available: true,
      trip: {
        name: trip.name,
        startDate: trip.start_date,
        endDate: trip.end_date,
        imageUrl: trip.image_url,
        description: trip.description,
        showExpenses: trip.public_show_expenses,
        activities,
      },
    });
  } catch (error) {
    console.error('Fetch public trip error:', error);
    return NextResponse.json({ error: 'No se ha podido cargar el itinerario' }, { status: 500 });
  }
}
