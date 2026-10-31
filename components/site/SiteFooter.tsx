import Link from 'next/link';
import { ENABLED_LANGS, LANG_NAMES, Lang, homePath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import type { LangPaths } from '@/lib/seo';
import { Logo } from './Logo';
import { navItems } from './nav-items';

// `alternates` = this page's translation group, so language pills only link to
// pages that really exist (never to a 404 or a different page).
export function SiteFooter({ lang, alternates }: { lang: Lang; alternates?: LangPaths }) {
  const t = ui(lang);
  const links = navItems(lang);
  return (
    <footer className="on-deep mt-20 bg-deep text-paper">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo href={homePath(lang)} tone="deep" className="text-paper" />
          <p className="max-w-xs text-[0.95rem] text-paper/80">{t.footerTag}</p>
          <p className="max-w-sm text-sm leading-relaxed text-paper/70">{t.notMedical}</p>
        </div>

        <nav aria-label={t.explore}>
          <h2 className="mb-3 text-sm font-semibold text-paper">{t.explore}</h2>
          <ul className="space-y-1">
            {links.map(l => (
              <li key={l.key}>
                <Link href={l.href} prefetch={false} className="inline-block py-1 text-[0.95rem] text-paper/80 hover:text-paper hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <nav aria-label={t.legal}>
            <h2 className="mb-3 text-sm font-semibold text-paper">{t.legal}</h2>
            <ul className="space-y-1">
              <li><Link href="/privacy" prefetch={false} className="inline-block py-1 text-[0.95rem] text-paper/80 hover:text-paper hover:underline">{t.privacy}</Link></li>
              <li><Link href="/terms" prefetch={false} className="inline-block py-1 text-[0.95rem] text-paper/80 hover:text-paper hover:underline">{t.terms}</Link></li>
            </ul>
          </nav>
          {ENABLED_LANGS.length > 1 && (
            <nav aria-label={t.languages}>
              <h2 className="mb-3 text-sm font-semibold text-paper">{t.languages}</h2>
              <ul className="flex flex-wrap gap-2">
                {ENABLED_LANGS.map(l => {
                  const href = alternates ? alternates[l] : homePath(l);
                  return href ? (
                    <li key={l}>
                      <Link href={href} hrefLang={l} prefetch={false}
                        aria-current={l === lang ? 'true' : undefined}
                        className={`inline-block rounded-full border px-3 py-1 text-sm ${l === lang ? 'border-paper bg-paper text-deep' : 'border-paper/30 text-paper/85 hover:border-paper'}`}>
                        {LANG_NAMES[l]}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
