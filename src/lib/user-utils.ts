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
