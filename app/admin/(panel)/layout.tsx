import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { ADMIN_COOKIE, isAdminCookie } from '@/lib/admin/auth';

// Only a Supabase user with the admin role gets past here; everyone else goes to the admin login.
// (The /api/admin routes check again on every request.)
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminCookie(cookies().get(ADMIN_COOKIE)?.value))) redirect('/admin/login');
  return <AdminShell>{children}</AdminShell>;
}
