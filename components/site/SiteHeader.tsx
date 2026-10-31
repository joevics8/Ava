import Link from 'next/link';
import { BOT_URL, Lang, homePath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import { Logo } from './Logo';
import { navItems } from './nav-items';

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const links = navItems(lang).filter(i => i.key !== 'home');
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo href={homePath(lang)} className="text-primary" />
        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label={t.mainNav} className="hidden items-center md:flex">
            {links.map(l => (
              <Link key={l.key} href={l.href} prefetch={false}
                className="rounded-lg px-3 py-2 text-[0.95rem] font-medium text-ink hover:bg-wash hover:text-primary">
                {l.label}
              </Link>
            ))}
          </nav>
          <a href={BOT_URL} rel="noopener"
            className="ml-1 inline-flex h-10 items-center rounded-full bg-marigold px-4 text-sm font-semibold text-ink transition-colors hover:bg-[hsl(39_92%_52%)]">
            {t.chatShort}
          </a>
        </div>
      </div>
    </header>
  );
}
