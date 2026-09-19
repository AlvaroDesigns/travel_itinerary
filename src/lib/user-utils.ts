export interface BaseUserCheck {
  role?: string | null;
  tenantId?: string | null;
  agencyName?: string | null;
}

/**
 * Returns true if the user belongs to a travel agency / has agency admin rights,
 * and false for standard individual / particular users.
 */
export function isAgencyUser(user: BaseUserCheck | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.role === 'admin' ||
    user.role === 'superadmin' ||
    user.role === 'superuser' ||
    (user.tenantId && user.tenantId !== 'particular')
  );
}

/**
 * Normalizes an agency URL ensuring it has an https:// protocol and no trailing slash.
 */
export function normalizeAgencyUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Builds the public itinerary link given a base URL and trip code/token.
 */
export function buildPublicTripUrl(baseUrl: string, code: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanCode = encodeURIComponent(code);
  if (cleanBase.endsWith('/publico')) {
    return `${cleanBase}/${cleanCode}`;
  }
  return `${cleanBase}/publico/${cleanCode}`;
}

