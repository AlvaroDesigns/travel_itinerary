import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';
import { AdminUsersPanel } from '@/components/AdminUsersPanel';

export default async function UsuariosPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }
  if (
    user.role !== 'superuser' &&
    user.role !== 'superadmin' &&
    user.role !== 'admin' &&
    (!user.tenantId || user.tenantId === 'particular')
  ) {
    redirect('/');
  }

  return (
    <DashboardShell activeMenu="usuarios">
      <AdminUsersPanel currentUser={user} />
    </DashboardShell>
  );
}
