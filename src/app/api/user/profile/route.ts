import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const userRes = await pool.query(
      `SELECT u.id, u.email, u.role, u.name, u.phone, u.company, u.tenant_id, u.agency_name, u.preferences, u.created_at,
              ts.agency_logo AS tenant_logo, ts.agency_name AS tenant_agency_name, ts.brand_color AS tenant_brand_color,
              ts.agency_cif AS tenant_cif, ts.terms_text AS tenant_terms, ts.agency_url AS tenant_agency_url
       FROM users u
       LEFT JOIN tenant_settings ts ON ts.tenant_id = u.tenant_id
       WHERE u.id = $1`,
      [session.userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const row = userRes.rows[0];
    const prefs = row.preferences || {};
    const isParticular = !row.tenant_id || row.tenant_id === 'particular';

    const agencyLogo = !isParticular && row.tenant_logo !== null && row.tenant_logo !== undefined
      ? row.tenant_logo
      : (prefs.agencyLogo || '');
    const brandColor = !isParticular && row.tenant_brand_color
      ? row.tenant_brand_color
      : ((prefs.brandColor && !['#009688', '#00796b', '#00a88a', '#00838f', '#00c9a7'].includes(prefs.brandColor.toLowerCase())) ? prefs.brandColor : '#0066FF');
    const agencyCif = !isParticular && row.tenant_cif
      ? row.tenant_cif
      : (prefs.agencyCif || '');
    const termsText = !isParticular && row.tenant_terms
      ? row.tenant_terms
      : (prefs.termsText || '');
    const agencyUrl = !isParticular && row.tenant_agency_url !== null && row.tenant_agency_url !== undefined
      ? row.tenant_agency_url
      : (prefs.agencyUrl || '');

    return NextResponse.json({
      id: row.id,
      email: row.email,
      role: row.role,
      name: row.name || '',
      phone: row.phone || '',
      company: row.company || '',
      tenantId: row.tenant_id || 'particular',
      agencyName: row.tenant_agency_name || row.agency_name || '',
      avatar: prefs.avatar || 'traveler-girl-teal',
      agencyUrl,
      preferences: {
        language: prefs.language || 'es',
        timezone: prefs.timezone || 'Europe/Madrid',
        weekStart: prefs.weekStart || 'lunes',
        timeFormat: prefs.timeFormat || '24h',
        dateFormat: prefs.dateFormat || 'dd/mm/yyyy',
        decimals: prefs.decimals || 'coma',
        currencyPosition: prefs.currencyPosition || 'fin',
        avatar: prefs.avatar || 'traveler-girl-teal',
        brandColor,
        defaultTheme: prefs.defaultTheme || 'classic',
        depositPercent: prefs.depositPercent !== undefined ? prefs.depositPercent : 30,
        dueDaysBeforeTrip: prefs.dueDaysBeforeTrip !== undefined ? prefs.dueDaysBeforeTrip : 15,
        agencyCif,
        termsText,
        agencyLogo,
        agencyUrl,
        paymentProviders: prefs.paymentProviders || {
          stripe: { status: 'in_progress', connected: false, email: '' },
          redsys: { status: 'not_connected', connected: false },
          inespay: { status: 'not_connected', connected: false },
        },
        notifications: prefs.notifications || {
          newTrips: true,
          vouchers: true,
          clientReminders: true,
          weeklySummary: false,
          securityAlerts: true,
        },
      },
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await initDb();
    const body = await request.json();
    const { name, phone, company, preferences } = body;

    await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           company = COALESCE($3, company),
           preferences = CASE WHEN $4::jsonb IS NOT NULL THEN COALESCE(preferences, '{}'::jsonb) || $4::jsonb ELSE preferences END
       WHERE id = $5`,
      [
        name !== undefined ? name.trim() : null,
        phone !== undefined ? phone.trim() : null,
        company !== undefined ? company.trim() : null,
        preferences ? JSON.stringify(preferences) : null,
        session.userId,
      ]
    );

    // If user belongs to an agency tenant (not particular), persist tenant branding into tenant_settings
    if (session.tenantId && session.tenantId !== 'particular' && preferences) {
      const tenantLogo = preferences.agencyLogo !== undefined ? preferences.agencyLogo : null;
      const tenantColor = preferences.brandColor || null;
      const tenantCif = preferences.agencyCif || null;
      const tenantTerms = preferences.termsText || null;
      const tenantUrl = preferences.agencyUrl !== undefined ? preferences.agencyUrl : null;
      const agencyName = session.agencyName || company || session.tenantId;

      await pool.query(
        `INSERT INTO tenant_settings (tenant_id, agency_name, agency_logo, brand_color, agency_cif, terms_text, agency_url, updated_at)
         VALUES ($1, $2, COALESCE($3, ''), COALESCE($4, '#0066FF'), COALESCE($5, ''), COALESCE($6, ''), COALESCE($7, ''), CURRENT_TIMESTAMP)
         ON CONFLICT (tenant_id) DO UPDATE SET
           agency_name = COALESCE(NULLIF($2, ''), tenant_settings.agency_name),
           agency_logo = CASE WHEN $3 IS NOT NULL THEN $3 ELSE tenant_settings.agency_logo END,
           brand_color = CASE WHEN $4 IS NOT NULL THEN $4 ELSE tenant_settings.brand_color END,
           agency_cif = CASE WHEN $5 IS NOT NULL THEN $5 ELSE tenant_settings.agency_cif END,
           terms_text = CASE WHEN $6 IS NOT NULL THEN $6 ELSE tenant_settings.terms_text END,
           agency_url = CASE WHEN $7 IS NOT NULL THEN $7 ELSE tenant_settings.agency_url END,
           updated_at = CURRENT_TIMESTAMP`,
        [session.tenantId, agencyName, tenantLogo, tenantColor, tenantCif, tenantTerms, tenantUrl]
      );

      // Keep all users of this tenant in sync with the agency logo and agency url
      if (tenantLogo !== null) {
        await pool.query(
          `UPDATE users
           SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{agencyLogo}', to_jsonb($2::text))
           WHERE tenant_id = $1`,
          [session.tenantId, tenantLogo]
        );
      }
      if (tenantUrl !== null) {
        await pool.query(
          `UPDATE users
           SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{agencyUrl}', to_jsonb($2::text))
           WHERE tenant_id = $1`,
          [session.tenantId, tenantUrl]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Perfil actualizado con éxito' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
