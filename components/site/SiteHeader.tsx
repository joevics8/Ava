import Link from 'next/link';
import { Lang, homePath, hubPath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = ui(lang);
  return (
    <header className="border-b border-pink-100 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href={homePath(lang)} className="text-xl font-bold text-[#E91E63]">🌸 Ava</Link>
        <nav className="flex items-center gap-5 text-sm text-gray-700">
          <Link href={hubPath(lang, 'tools')} prefetch={false} className="hover:text-[#E91E63]">{t.tools}</Link>
          <Link href={hubPath(lang, 'blog')} prefetch={false} className="hover:text-[#E91E63]">{t.blog}</Link>
          <Link href="/dashboard" prefetch={false} className="rounded-full bg-[#E91E63] px-4 py-1.5 font-medium text-white hover:bg-[#C2185B]">{t.dashboard}</Link>
        </nav>
      </div>
    </header>
  );
}
