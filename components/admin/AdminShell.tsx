import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3" aria-label="Admin">
          <Link href="/admin" prefetch={false} className="font-display text-lg font-bold">Verm admin</Link>
          <Link href="/admin/blog" prefetch={false} className="text-sm font-semibold text-muted-ink hover:text-primary">Blog</Link>
          <Link href="/admin/tools" prefetch={false} className="text-sm font-semibold text-muted-ink hover:text-primary">Tools</Link>
          <Link href="/admin/audio" prefetch={false} className="text-sm font-semibold text-muted-ink hover:text-primary">Audio</Link>
          <span className="ml-auto flex gap-4 text-sm">
            <Link href="/" prefetch={false} className="text-muted-ink hover:text-primary">View site</Link>
            <LogoutButton />
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
