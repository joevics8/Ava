import Link from 'next/link';
import type { Lang } from '@/lib/site';
import { PageShell } from './PageShell';
import { navItems } from './nav-items';

// A 404 should still be useful: links back into the site keep visitors and
// crawlers moving instead of dead-ending.
export function NotFoundView({ lang }: { lang: Lang }) {
  const es = lang === 'es';
  return (
    <PageShell lang={lang}>
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{es ? 'No encontramos esa página' : 'We can’t find that page'}</h1>
      <p className="mb-8 mt-4 max-w-xl text-lg leading-relaxed text-muted-ink">
        {es ? 'Puede que el enlace haya cambiado o que la página ya no exista. Prueba con una de estas:' : 'The link may have changed, or the page may no longer exist. Try one of these instead:'}
      </p>
      <ul className="flex flex-wrap gap-3">
        {navItems(lang).filter(i => i.key !== 'dashboard').map(i => (
          <li key={i.key}>
            <Link href={i.href} prefetch={false} className="inline-flex h-12 items-center rounded-full border border-primary px-6 font-semibold text-primary hover:bg-wash">{i.label}</Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
