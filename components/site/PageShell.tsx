import { Lang, RTL_LANGS } from '@/lib/site';
import type { LangPaths } from '@/lib/seo';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ConsentAndAds } from './ConsentAndAds';

export function PageShell({ lang, alternates, children }: { lang: Lang; alternates?: LangPaths; children: React.ReactNode }) {
  return (
    <div lang={lang} dir={RTL_LANGS.includes(lang) ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <SiteFooter lang={lang} alternates={alternates} />
      <ConsentAndAds lang={lang} />
    </div>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && ' › '}
          {it.href ? <a href={it.href} className="hover:text-[#E91E63]">{it.name}</a> : <span>{it.name}</span>}
        </span>
      ))}
    </nav>
  );
}
