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

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const tenantFilter = url.searchParams.get('tenantId')?.trim() ?? '';
  const isSuper = user.role === 'superuser' || user.role === 'superadmin';
  const userTenant = user.tenantId || 'particular';

  try {
    let params: unknown[] = [];
    let tripWhere = '';
    let userWhere = '';

    if (!isSuper) {
      params = [user.userId, userTenant];
      tripWhere = 'WHERE (t.user_id = $1 OR ($2 <> \'particular\' AND u.tenant_id = $2))';
      userWhere = 'WHERE (id = $1 OR ($2 <> \'particular\' AND tenant_id = $2))';
    } else if (tenantFilter && tenantFilter !== 'all') {
      params = [tenantFilter];
      tripWhere = 'WHERE u.tenant_id = $1';
      userWhere = 'WHERE tenant_id = $1';
    }

    const overviewSql = `
      SELECT
        (SELECT COUNT(*) FROM users ${userWhere})::text AS total_users,
        (SELECT COUNT(*) FROM users ${userWhere ? userWhere + ' AND is_active' : 'WHERE is_active'})::text AS active_users,
        (SELECT COUNT(*) FROM users ${userWhere ? userWhere + " AND role = 'admin'" : "WHERE role = 'admin'"})::text AS admin_users,
        (SELECT COUNT(*) FROM users ${userWhere ? userWhere + " AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'" : "WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'"})::text AS new_users_last_30_days,
        (SELECT COUNT(*) FROM trips t JOIN users u ON u.id = t.user_id ${tripWhere})::text AS total_trips,
        (SELECT COUNT(*) FROM trips t JOIN users u ON u.id = t.user_id ${tripWhere ? tripWhere + " AND t.start_date > CURRENT_DATE::text" : "WHERE t.start_date > CURRENT_DATE::text"})::text AS upcoming_trips,
        (SELECT COUNT(*) FROM trips t JOIN users u ON u.id = t.user_id ${tripWhere ? tripWhere + " AND t.start_date <= CURRENT_DATE::text AND t.end_date >= CURRENT_DATE::text" : "WHERE t.start_date <= CURRENT_DATE::text AND t.end_date >= CURRENT_DATE::text"})::text AS active_trips,
        (SELECT COUNT(*) FROM activities a JOIN trips t ON t.id = a.trip_id JOIN users u ON u.id = t.user_id ${tripWhere})::text AS total_activities,
        (SELECT COALESCE(SUM(a.price), 0) FROM activities a JOIN trips t ON t.id = a.trip_id JOIN users u ON u.id = t.user_id ${tripWhere})::text AS total_activity_spend,
        (SELECT COUNT(*) FROM trip_notification_settings s JOIN trips t ON t.id = s.trip_id JOIN users u ON u.id = t.user_id ${tripWhere ? tripWhere + ' AND s.reminder_enabled' : 'WHERE s.reminder_enabled'})::text AS reminders_enabled,
        (SELECT COUNT(*) FROM trip_notification_settings s JOIN trips t ON t.id = s.trip_id JOIN users u ON u.id = t.user_id ${tripWhere ? tripWhere + ' AND s.public_access_enabled' : 'WHERE s.public_access_enabled'})::text AS public_links_enabled
    `;

    const breakdownSql = `
      SELECT a.type, COUNT(*)::text AS count, COALESCE(SUM(a.price), 0)::text AS spend
      FROM activities a
      JOIN trips t ON t.id = a.trip_id
      JOIN users u ON u.id = t.user_id
      ${tripWhere}
      GROUP BY a.type
      ORDER BY COUNT(*) DESC, a.type ASC
    `;

    const recentUsersSql = `
      SELECT id, email, role, created_at
      FROM users
      ${userWhere}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [overviewResult, breakdownResult, recentUsersResult] = await Promise.all([
      pool.query<OverviewRow>(overviewSql, params),
      pool.query<ActivityBreakdownRow>(breakdownSql, params),
      pool.query<RecentUserRow>(recentUsersSql, params),
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
