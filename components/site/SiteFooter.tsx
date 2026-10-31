import Link from 'next/link';
import { ENABLED_LANGS, LANG_NAMES, Lang, homePath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import type { LangPaths } from '@/lib/seo';

// `alternates` = this page's translation group, so language pills only link to
// pages that really exist (never to a 404 or a different page).
export function SiteFooter({ lang, alternates }: { lang: Lang; alternates?: LangPaths }) {
  const t = ui(lang);
  return (
    <footer className="mt-16 border-t border-pink-100 bg-white">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 text-sm text-gray-500">
        <p className="font-semibold text-[#E91E63]">🌸 Ava — {t.footerTag}</p>
        <p>{t.notMedical}</p>
        {ENABLED_LANGS.length > 1 && (
          <nav aria-label={t.languages} className="flex flex-wrap gap-3">
            {ENABLED_LANGS.map(l => {
              const href = alternates ? alternates[l] : homePath(l);
              return href ? (
                <Link key={l} href={href} hrefLang={l} prefetch={false} className={l === lang ? 'font-semibold text-gray-800' : 'hover:text-[#E91E63]'}>
                  {LANG_NAMES[l]}
                </Link>
              ) : null;
            })}
          </nav>
        )}
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-[#E91E63]">{t.privacy}</Link>
          <Link href="/terms" className="hover:text-[#E91E63]">{t.terms}</Link>
        </div>
      </div>
    </footer>
  );
}
