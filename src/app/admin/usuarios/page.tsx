import { redirect } from 'next/navigation';
import { AdminUsersPanel } from '@/components/AdminUsersPanel';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function AdminUsersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  return <AdminUsersPanel currentUser={user} />;
}
