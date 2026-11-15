import '../globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RootDocument } from '@/components/site/RootDocument';
import { AdminShell } from '@/components/admin/AdminShell';
import { isAdminSession, readSession } from '@/lib/admin/auth';

// Never cached, never indexed. Anyone who is not the admin Telegram account is
// sent to the normal login. (The /api/admin routes check the session again.)
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminSession(readSession(cookies().get('ava_session')?.value))) redirect('/login');
  return (
    <RootDocument lang="en">
      <AdminShell>{children}</AdminShell>
    </RootDocument>
  );
}
