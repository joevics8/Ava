import Link from 'next/link';
import type { Lang } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import type { LangPaths } from '@/lib/seo';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ConsentAndAds } from './ConsentAndAds';
import { BottomNav } from './BottomNav';
import { navItems } from './nav-items';

export function PageShell({ lang, alternates, children, wide = false, flush = false }: {
  lang: Lang; alternates?: LangPaths; children: React.ReactNode;
  /** Wider column for the home page's multi-column sections. */
  wide?: boolean;
  /** No built-in column or padding: the page lays out its own full-bleed sections. */
  flush?: boolean;
}) {
  const t = ui(lang);
  return (
    <div className="min-h-screen bg-paper pb-[3.75rem] text-ink md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-marigold focus:px-4 focus:py-2 focus:font-semibold focus:text-ink">
        {t.skip}
      </a>
      <SiteHeader lang={lang} />
      <main id="main" className={flush ? '' : `mx-auto px-4 py-8 sm:py-10 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>{children}</main>
      <SiteFooter lang={lang} alternates={alternates} />
      <BottomNav items={navItems(lang)} label={t.mainNav} />
      <ConsentAndAds lang={lang} />
    </div>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-ink">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-muted-ink/60">/</span>}
            {it.href ? <Link href={it.href} prefetch={false} className="underline-offset-4 hover:text-primary hover:underline">{it.name}</Link> : <span aria-current="page" className="text-ink">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
