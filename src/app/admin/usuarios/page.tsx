import { redirect } from 'next/navigation';
import { AdminUsersPanel } from '@/components/AdminUsersPanel';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function AdminUsersPage() {
  redirect('/usuarios');
}
