import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HUB_MIN_PAGES, Lang, absolute, blogPath, homePath, hubPath, toolPath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import { BlogPost, getPost, getTranslations, listPosts } from '@/lib/blog';
import { findTool, toolAlternates, toolsFor } from '@/lib/tools/registry';
import { breadcrumbLd, faqLd, graphLd, pageMetadata, sanitizeHtml, webPageLd, LangPaths } from '@/lib/seo';
import { Breadcrumbs, JsonLd, PageShell } from './PageShell';
import { TelegramCta } from './TelegramCta';
import { ToolClient } from './ToolClient';
import { RelatedTools } from './RelatedTools';
import { AdUnit } from './AdUnit';

// Shared page implementations. Route files are one-liners that call these, so
// English (/tools/x) and every other language (/{lang}/{segment}/x) render
// identically from the same data.

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
    { '@type': 'SoftwareApplication', name: text.h1, applicationCategory: 'HealthApplication', operatingSystem: 'Web', inLanguage: lang, url: absolute(path),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
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
      <section className="my-12">
        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">{t.faq}</h2>
        <div className="border-t border-line">
          {text.faqs.map(f => (
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
      <RelatedTools lang={lang} ids={tool.related} />
    </PageShell>
  );
}

// ── Tools hub ────────────────────────────────────────────────────────
export function toolsHubMetadata(lang: Lang): Metadata {
  const t = ui(lang);
  const n = toolsFor(lang).length;
  return pageMetadata({
    lang, path: hubPath(lang, 'tools'), title: `${t.tools} | Ava`,
    description: lang === 'es' ? 'Herramientas gratuitas y privadas para entender tu ciclo: periodo, ovulación y fecha de parto.' : 'Free, private tools to understand your cycle: period, ovulation and due date calculators.',
    noindex: n < HUB_MIN_PAGES && lang !== 'en',
  });
}

export function ToolsHub({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const items = toolsFor(lang);
  if (!items.length) notFound();
  return (
    <PageShell lang={lang}>
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.tools }]} />
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.tools}</h1>
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
export function blogHubMetadata(lang: Lang, postCount: number): Metadata {
  return pageMetadata({
    lang, path: hubPath(lang, 'blog'), title: `${ui(lang).blog} | Ava`,
    description: lang === 'es' ? 'Guías claras sobre tu ciclo, tu cuerpo y tu salud, escritas para que puedas actuar.' : 'Clear guides on your cycle, your body and your health — written so you can act on them.',
    noindex: postCount < HUB_MIN_PAGES && lang !== 'en' ? true : postCount === 0,
  });
}

export async function BlogHub({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const posts = await listPosts(lang);
  return (
    <PageShell lang={lang}>
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.blog }]} />
      <h1 className="mb-8 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.latestPosts}</h1>
      {posts.length === 0 ? <p className="text-muted-ink">{t.noPosts}</p> : (
        <ul className="space-y-6">
          {posts.map(p => (
            <li key={p.slug}>
              <Link href={blogPath(lang, p.slug)} prefetch={false} className="group block rounded-2xl border border-line bg-white p-5 transition-colors hover:border-primary">
                <h2 className="font-display text-xl font-semibold leading-snug group-hover:text-primary">{p.title}</h2>
                {p.excerpt && <p className="mt-1 text-muted-ink">{p.excerpt}</p>}
                {p.read_time && <p className="mt-3 text-sm text-muted-ink">{p.read_time} {t.minRead}</p>}
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
  });
}

export async function BlogPostPage({ lang, slug }: { lang: Lang; slug: string }) {
  const post = await getPost(lang, slug);
  if (!post) notFound();
  const t = ui(lang);
  const path = blogPath(lang, slug);
  const crumbs = [{ name: t.home, path: homePath(lang) }, { name: t.blog, path: hubPath(lang, 'blog') }, { name: post.title, path }];
  const ld = graphLd([
    webPageLd(path, post.title, post.excerpt ?? post.title, lang),
    breadcrumbLd(crumbs),
    { '@type': 'Article', headline: post.title, description: post.excerpt ?? undefined, inLanguage: lang, datePublished: post.published_at ?? undefined,
      dateModified: post.updated_at ?? post.published_at ?? undefined, mainEntityOfPage: absolute(path), author: { '@type': 'Organization', name: 'Ava' },
      publisher: { '@type': 'Organization', name: 'Ava' } },
    ...(post.faqs?.length ? [faqLd(post.faqs)] : []),
  ]);
  const html = sanitizeHtml(post.content);
  return (
    <PageShell lang={lang} alternates={await altGroup(post)}>
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: t.home, href: homePath(lang) }, { name: t.blog, href: hubPath(lang, 'blog') }, { name: post.title }]} />
      <article>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        {post.read_time && <p className="mb-8 mt-3 text-sm text-muted-ink">{post.read_time} {t.minRead}</p>}
        <div className="prose-ava"
          dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG} className="my-8" />
      <TelegramCta line={lang === 'es' ? '¿Quieres respuestas sobre tu propio ciclo? Habla con Ava.' : 'Want answers about your own cycle? Talk to Ava.'} button={t.startOnTelegram} />
      <p className="text-sm text-muted-ink">{t.notMedical}</p>
    </PageShell>
  );
}

// ── Localised home (non-English) ─────────────────────────────────────
export function LocalHome({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const items = toolsFor(lang);
  if (!items.length) notFound();
  const es = lang === 'es';
  return (
    <PageShell lang={lang}>
      <section className="py-6">
        <h1 className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">{es ? 'Ava: tu ciclo y tu cuerpo, explicados' : 'Ava'}</h1>
        <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-ink">{es ? 'Una compañera en Telegram que aprende tu ciclo, recuerda tus síntomas y responde tus dudas con claridad.' : ''}</p>
      </section>
      <ToolsListInline lang={lang} />
      <TelegramCta line={es ? 'Gratis para empezar. Sin descargar nada.' : ''} button={t.startOnTelegram} />
    </PageShell>
  );
}

function ToolsListInline({ lang }: { lang: Lang }) {
  const items = toolsFor(lang);
  return (
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
  );
}
