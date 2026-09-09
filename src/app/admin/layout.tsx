import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'superuser') redirect('/');

  return <AdminShell currentUser={user}>{children}</AdminShell>;
}
