import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { ENABLED_LANGS, HUB_MIN_PAGES, Lang, absolute, blogPath, homePath, hubPath, toolPath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import { BlogPost, getPost, getTranslations, listPosts, relatedPosts } from '@/lib/blog';
import { findTool, toolAlternates, toolsFor } from '@/lib/tools/registry';
import {
  LangPaths, articleLd, breadcrumbLd, collectionLd, faqLd, graphLd, homeGroup, isIndexableHome, pageMetadata, softwareAppLd, webPageLd,
} from '@/lib/seo';
import { extractHeadings, readMinutes, wordCount } from '@/lib/markdown';
import { Breadcrumbs, JsonLd, PageShell } from './PageShell';
import { TelegramCta } from './TelegramCta';
import { ToolClient } from './ToolClient';
import { RelatedTools } from './RelatedTools';
import { AdUnit } from './AdUnit';
import { Markdown } from './Markdown';

// Shared page implementations. Route files are one-liners that call these, so
// English (/tools/x) and every other language (/{lang}/{segment}/x) render
// identically from the same data.

const fmtDate = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Native <details> accordion: works without JavaScript and keeps every answer in the HTML for crawlers. */
function Faq({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <section className="my-12">
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">{title}</h2>
      <div className="border-t border-line">
        {items.map(f => (
          <details key={f.q} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="max-w-2xl pb-5 leading-relaxed text-muted-ink">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Tool page ────────────────────────────────────────────────────────
export function toolMetadata(lang: Lang, slug: string): Metadata {
  const hit = findTool(lang, slug);
  if (!hit) return {};
  return pageMetadata({ lang, path: toolPath(lang, slug), title: hit.text.title, description: hit.text.description, group: toolAlternates(hit.tool) });
}

export function ToolPage({ lang, slug }: { lang: Lang; slug: string }) {
  const hit = findTool(lang, slug);
  if (!hit) notFound();
  const { tool, text } = hit;
  const t = ui(lang);
  const path = toolPath(lang, slug);
  const crumbs = [
    { name: t.home, path: homePath(lang) },
    { name: t.tools, path: hubPath(lang, 'tools') },
    { name: text.h1, path },
  ];
  const ld = graphLd([
    webPageLd(path, text.title, text.description, lang),
    breadcrumbLd(crumbs),
    faqLd(text.faqs),
    softwareAppLd({ lang, path, name: text.h1, description: text.description }),
  ]);
  return (
    <PageShell lang={lang} alternates={toolAlternates(tool)}>
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.tools, href: hubPath(lang, 'tools') }, { name: text.h1 }]} />
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{text.h1}</h1>
      <p className="mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-muted-ink">{text.intro}</p>
      <ToolClient toolId={tool.id} lang={lang} />
      <TelegramCta line={text.cta} button={t.startOnTelegram} />
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL} className="my-6" />
      <Faq title={t.faq} items={text.faqs} />
      <RelatedTools lang={lang} ids={tool.related} />
    </PageShell>
  );
}

// ── Tools hub ────────────────────────────────────────────────────────
/** hreflang for the tools hub: only languages whose hub is indexable, so alternates are always reciprocal. */
function toolsHubGroup(): LangPaths | undefined {
  const langs = ENABLED_LANGS.filter(l => (l === 'en' ? toolsFor(l).length > 0 : toolsFor(l).length >= HUB_MIN_PAGES));
  return langs.length > 1 ? Object.fromEntries(langs.map(l => [l, hubPath(l, 'tools')])) : undefined;
}

export function toolsHubMetadata(lang: Lang): Metadata {
  const t = ui(lang);
  const n = toolsFor(lang).length;
  return pageMetadata({
    lang, path: hubPath(lang, 'tools'), title: t.toolsTitle, description: t.toolsDesc,
    group: toolsHubGroup(), noindex: n < HUB_MIN_PAGES && lang !== 'en',
  });
}

export function ToolsHub({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const items = toolsFor(lang);
  if (!items.length) notFound();
  const path = hubPath(lang, 'tools');
  const ld = graphLd([
    collectionLd(path, t.toolsTitle, t.toolsDesc, lang, items.map(({ text }) => ({ name: text.h1, path: toolPath(lang, text.slug) }))),
    breadcrumbLd([{ name: t.home, path: homePath(lang) }, { name: t.tools, path }]),
  ]);
  return (
    <PageShell lang={lang}>
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.tools }]} />
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t.toolsH1}</h1>
      <p className="mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-muted-ink">{t.toolsIntro}</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(({ text }) => (
          <li key={text.slug}>
            <Link href={toolPath(lang, text.slug)} prefetch={false} className="group block h-full rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary">
              <h2 className="font-display text-lg font-semibold group-hover:text-primary">{text.h1}</h2>
              <p className="mt-1 text-muted-ink">{text.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <TelegramCta line={lang === 'es' ? 'Ava responde tus dudas sobre tu cuerpo, a cualquier hora.' : 'Ava answers your questions about your body, any time.'} button={t.startOnTelegram} />
    </PageShell>
  );
}

// ── Blog hub ─────────────────────────────────────────────────────────
export async function blogHubMetadata(lang: Lang, postCount: number): Promise<Metadata> {
  const t = ui(lang);
  // hreflang only between languages whose blog hub is itself indexable.
  const counts = await Promise.all(ENABLED_LANGS.map(async l => [l, l === lang ? postCount : (await listPosts(l)).length] as const));
  const live = counts.filter(([l, n]) => (l === 'en' ? n > 0 : n >= HUB_MIN_PAGES)).map(([l]) => l);
  const group = live.length > 1 ? Object.fromEntries(live.map(l => [l, hubPath(l, 'blog')])) : undefined;
  return pageMetadata({
    lang, path: hubPath(lang, 'blog'), title: t.blogTitle, description: t.blogDesc, group,
    noindex: lang !== 'en' ? postCount < HUB_MIN_PAGES : postCount === 0,
  });
}

export async function BlogHub({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const posts = await listPosts(lang);
  const path = hubPath(lang, 'blog');
  const ld = graphLd([
    collectionLd(path, t.blogTitle, t.blogDesc, lang, posts.map(p => ({ name: p.title, path: blogPath(lang, p.slug) }))),
    breadcrumbLd([{ name: t.home, path: homePath(lang) }, { name: t.blog, path }]),
  ]);
  return (
    <PageShell lang={lang}>
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.blog }]} />
      <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t.blogH1}</h1>
      <p className="mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-muted-ink">{t.blogIntro}</p>
      {posts.length === 0 ? <p className="text-muted-ink">{t.noPosts}</p> : (
        <ul className="space-y-4">
          {posts.map(p => (
            <li key={p.slug}>
              <Link href={blogPath(lang, p.slug)} prefetch={false} className="group block rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary">
                {p.category && <p className="text-sm font-medium text-primary">{p.category}</p>}
                <h2 className="font-display text-xl font-semibold leading-snug group-hover:text-primary">{p.title}</h2>
                {p.excerpt && <p className="mt-1 text-muted-ink">{p.excerpt}</p>}
                <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-muted-ink">
                  {p.published_at && <time dateTime={p.published_at}>{fmtDate(p.published_at, lang)}</time>}
                  {p.read_time && <span>{p.read_time} {t.minRead}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <TelegramCta line={lang === 'es' ? '¿Tienes una pregunta sobre tu cuerpo? Pregúntale a Ava.' : 'Have a question about your body? Ask Ava.'} button={t.startOnTelegram} />
    </PageShell>
  );
}

// ── Blog post ────────────────────────────────────────────────────────
async function altGroup(post: BlogPost): Promise<LangPaths> {
  const group: LangPaths = { [post.language]: blogPath(post.language, post.slug) };
  for (const tr of await getTranslations(post.translation_group)) group[tr.language] = blogPath(tr.language, tr.slug);
  return group;
}

export async function blogPostMetadata(lang: Lang, slug: string): Promise<Metadata> {
  const post = await getPost(lang, slug);
  if (!post) return {};
  return pageMetadata({
    lang, path: blogPath(lang, slug), title: post.title, description: post.excerpt ?? post.title,
    group: await altGroup(post), type: 'article',
    publishedTime: post.published_at, modifiedTime: post.updated_at ?? post.published_at, section: post.category,
  });
}

export async function BlogPostPage({ lang, slug }: { lang: Lang; slug: string }) {
  const post = await getPost(lang, slug);
  if (!post) notFound();
  const t = ui(lang);
  const path = blogPath(lang, slug);
  const [alternates, related] = await Promise.all([altGroup(post), relatedPosts(lang, slug, post.category)]);

  const headings = extractHeadings(post.content);
  const words = wordCount(post.content);
  const minutes = post.read_time ?? readMinutes(post.content);
  const description = post.excerpt ?? post.title;
  const published = post.published_at;
  // Only show "Updated" when it is meaningfully later than the publish date.
  const showUpdated = !!(published && post.updated_at && new Date(post.updated_at).getTime() - new Date(published).getTime() > 86_400_000);

  const crumbs = [{ name: t.home, path: homePath(lang) }, { name: t.blog, path: hubPath(lang, 'blog') }, { name: post.title, path }];
  const ld = graphLd([
    webPageLd(path, post.title, description, lang, { datePublished: published, dateModified: post.updated_at ?? published }),
    breadcrumbLd(crumbs),
    articleLd({ lang, path, headline: post.title, description, datePublished: published, dateModified: post.updated_at, section: post.category, words }),
    ...(post.faqs?.length ? [faqLd(post.faqs)] : []),
  ]);

  return (
    <PageShell lang={lang} alternates={alternates}>
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.blog, href: hubPath(lang, 'blog') }, { name: post.title }]} />
      <article>
        <header className="mb-8">
          {post.category && <p className="mb-2 text-sm font-medium text-primary">{post.category}</p>}
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-ink">
            {published && <span>{t.publishedOn} <time dateTime={published}>{fmtDate(published, lang)}</time></span>}
            {showUpdated && <span>{t.updatedOn} <time dateTime={post.updated_at!}>{fmtDate(post.updated_at!, lang)}</time></span>}
            <span>{minutes} {t.minRead}</span>
          </p>
        </header>

        {headings.length >= 3 && (
          <nav aria-label={t.onThisPage} className="mb-10 max-w-prose rounded-2xl border border-line bg-wash p-5">
            <h2 className="mb-2 font-display text-lg font-semibold">{t.onThisPage}</h2>
            <ol className="space-y-1">
              {headings.map(h => (
                <li key={h.id} className={h.depth === 3 ? 'ml-4' : ''}>
                  <a href={`#${h.id}`} className="inline-block py-0.5 text-primary underline-offset-4 hover:underline">{h.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Markdown>{post.content}</Markdown>

        {/* FAQ markup must match what readers can see, so the questions are shown, not just in JSON-LD. */}
        {post.faqs && post.faqs.length > 0 && <Faq title={t.faq} items={post.faqs} />}
      </article>

      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG} className="my-8" />
      <TelegramCta line={lang === 'es' ? '¿Quieres respuestas sobre tu propio ciclo? Habla con Ava.' : 'Want answers about your own cycle? Talk to Ava.'} button={t.startOnTelegram} />

      {related.length > 0 && (
        <section className="my-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 font-display text-2xl font-bold tracking-tight">{t.relatedArticles}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {related.map(r => (
              <li key={r.slug}>
                <Link href={blogPath(lang, r.slug)} prefetch={false} className="group block h-full rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary">
                  <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">{r.title}</h3>
                  {r.excerpt && <p className="mt-1 line-clamp-2 text-muted-ink">{r.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-sm text-muted-ink">{t.notMedical}</p>
    </PageShell>
  );
}

// ── Localised home (non-English) ─────────────────────────────────────
export function localHomeMetadata(lang: Lang): Metadata {
  const es = lang === 'es';
  return pageMetadata({
    lang, path: homePath(lang), group: homeGroup(), noindex: !isIndexableHome(lang),
    title: es ? 'Ava: tu ciclo y tu cuerpo, explicados' : 'Ava',
    description: es ? 'Calculadoras gratuitas y una compañera en Telegram que aprende tu ciclo y responde tus dudas.' : ui(lang).toolsDesc,
  });
}

export function LocalHome({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const items = toolsFor(lang);
  if (!items.length) notFound();
  const es = lang === 'es';
  const title = es ? 'Ava: tu ciclo y tu cuerpo, explicados' : 'Ava';
  const intro = es
    ? 'Una compañera en Telegram que aprende tu ciclo, recuerda tus síntomas y responde tus dudas con claridad.'
    : t.toolsIntro;
  const ld = graphLd([
    webPageLd(homePath(lang), title, intro, lang, { breadcrumb: false }),
    { '@type': 'ItemList', itemListElement: items.map(({ text }, i) => ({ '@type': 'ListItem', position: i + 1, url: absolute(toolPath(lang, text.slug)), name: text.h1 })) },
  ]);
  return (
    <PageShell lang={lang}>
      <JsonLd data={ld} />
      <section className="py-6">
        <h1 className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">{title}</h1>
        <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-ink">{intro}</p>
      </section>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">{t.toolsH1}</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map(({ text }) => (
          <li key={text.slug}>
            <Link href={toolPath(lang, text.slug)} prefetch={false} className="group block h-full rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary">
              <h3 className="font-display text-lg font-semibold group-hover:text-primary">{text.h1}</h3>
              <p className="mt-1 text-muted-ink">{text.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <TelegramCta line={es ? 'Gratis para empezar. Sin descargar nada.' : t.homeCta} button={t.startOnTelegram} />
    </PageShell>
  );
}
