import { Lang, RTL_LANGS } from '@/lib/site';
import { display, reading } from '@/lib/fonts';

/**
 * The <html> and <body> for a page. The app has two root layouts, one for
 * English (everything outside /[lang]) and one for language-prefixed pages, so
 * `lang` and `dir` on <html> always match the page's content language.
 */
export function RootDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} dir={RTL_LANGS.includes(lang) ? 'rtl' : 'ltr'} className={`${display.variable} ${reading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
