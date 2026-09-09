import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/db';

type OverviewRow = {
  total_users: string;
  active_users: string;
  admin_users: string;
  new_users_last_30_days: string;
  total_trips: string;
  upcoming_trips: string;
  active_trips: string;
  total_activities: string;
  total_activity_spend: string;
  reminders_enabled: string;
  public_links_enabled: string;
};

type ActivityBreakdownRow = {
  type: string;
  count: string;
  spend: string;
};

type RecentUserRow = {
  id: number;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  created_at: string;
};

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const [overviewResult, breakdownResult, recentUsersResult] = await Promise.all([
      pool.query<OverviewRow>(`
        SELECT
          (SELECT COUNT(*) FROM users)::text AS total_users,
          (SELECT COUNT(*) FROM users WHERE is_active)::text AS active_users,
          (SELECT COUNT(*) FROM users WHERE role = 'admin')::text AS admin_users,
          (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days')::text AS new_users_last_30_days,
          (SELECT COUNT(*) FROM trips)::text AS total_trips,
          (SELECT COUNT(*) FROM trips WHERE start_date > CURRENT_DATE::text)::text AS upcoming_trips,
          (SELECT COUNT(*) FROM trips WHERE start_date <= CURRENT_DATE::text AND end_date >= CURRENT_DATE::text)::text AS active_trips,
          (SELECT COUNT(*) FROM activities)::text AS total_activities,
          (SELECT COALESCE(SUM(price), 0) FROM activities)::text AS total_activity_spend,
          (SELECT COUNT(*) FROM trip_notification_settings WHERE reminder_enabled)::text AS reminders_enabled,
          (SELECT COUNT(*) FROM trip_notification_settings WHERE public_access_enabled)::text AS public_links_enabled
      `),
      pool.query<ActivityBreakdownRow>(`
        SELECT type, COUNT(*)::text AS count, COALESCE(SUM(price), 0)::text AS spend
        FROM activities
        GROUP BY type
        ORDER BY COUNT(*) DESC, type ASC
      `),
      pool.query<RecentUserRow>(`
        SELECT id, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    const overview = overviewResult.rows[0];
    return NextResponse.json({
      overview: {
        totalUsers: Number(overview.total_users),
        activeUsers: Number(overview.active_users),
        adminUsers: Number(overview.admin_users),
        newUsersLast30Days: Number(overview.new_users_last_30_days),
        totalTrips: Number(overview.total_trips),
        upcomingTrips: Number(overview.upcoming_trips),
        activeTrips: Number(overview.active_trips),
        totalActivities: Number(overview.total_activities),
        totalActivitySpend: Number(overview.total_activity_spend),
        remindersEnabled: Number(overview.reminders_enabled),
        publicLinksEnabled: Number(overview.public_links_enabled),
      },
      activityBreakdown: breakdownResult.rows.map((row) => ({
        type: row.type,
        count: Number(row.count),
        spend: Number(row.spend),
      })),
      recentUsers: recentUsersResult.rows.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Fetch admin dashboard error:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las métricas' }, { status: 500 });
  }
}
