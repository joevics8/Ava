#!/usr/bin/env node
// Crawls a running copy of the site (default http://localhost:3000) starting from
// its sitemaps and checks the things that affect search rankings and rich results.
//
//   npm run build && npm start &      # in one terminal
//   node scripts/seo-audit.mjs http://localhost:3000
//
// No dependencies: HTML is inspected with regular expressions, which is enough for
// the well-formed markup Next.js emits. Exit code is 1 if any check fails.

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const failures = [];
const warnings = [];
const fail = (url, msg) => failures.push(`${url}  ${msg}`);
const warn = (url, msg) => warnings.push(`${url}  ${msg}`);

const get = async (url, init) => { try { return await fetch(url, { redirect: 'manual', ...init }); } catch (e) { return { status: 0, text: async () => '', headers: new Headers(), error: String(e) }; } };
const local = (u) => { try { const x = new URL(u, BASE); return x.origin === new URL(BASE).origin || x.host === new URL(BASE).host ? x.pathname + x.search : null; } catch { return null; } };
// Sitemaps and canonicals use the deployed site URL (NEXT_PUBLIC_SITE_URL); map any host back onto BASE for fetching.
const toBase = (u) => { try { const x = new URL(u); return BASE + x.pathname + x.search; } catch { return u; } };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => { const m = new RegExp(`${name}=("([^"]*)"|'([^']*)')`, 'i').exec(tag); return m ? decode(m[2] ?? m[3]) : null; };
const tags = (html, re) => [...html.matchAll(re)].map(m => m[0]);
const meta = (html, key, by = 'name') => { const t = tags(html, /<meta\b[^>]*>/gi).find(x => attr(x, by)?.toLowerCase() === key.toLowerCase()); return t ? attr(t, 'content') : null; };
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ── gather URLs from sitemaps ─────────────────────────────────────────────
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
const sitemapPages = new Map();      // path -> { alts: {lang: path} }
const inSitemap = new Set();
async function readSitemaps() {
  const idx = await get(`${BASE}/sitemap.xml`);
  if (idx.status !== 200) return fail('/sitemap.xml', `status ${idx.status}`);
  const idxXml = await idx.text();
  if (/<lastmod>/.test(idxXml)) {
    for (const m of idxXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
      if (Math.abs(Date.now() - new Date(m[1]).getTime()) < 60_000) warn('/sitemap.xml', 'lastmod is "right now": only include a lastmod that is true');
    }
  }
  for (const sm of locs(idxXml)) {
    const r = await get(toBase(sm)); const xml = await r.text();
    if (r.status !== 200 || !xml.includes('<urlset')) { fail(sm, `sitemap status ${r.status}`); continue; }
    for (const block of xml.split('<url>').slice(1)) {
      const loc = locs(block)[0]; if (!loc) continue;
      const path = local(toBase(loc));
      const alts = {};
      for (const a of block.matchAll(/<xhtml:link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) alts[a[1]] = local(toBase(a[2]));
      sitemapPages.set(path, { alts }); inSitemap.add(path);
    }
  }
}

// ── per-page checks ───────────────────────────────────────────────────────
const pages = new Map();             // path -> { status, html, headers }
const titles = new Map(); const descs = new Map();
const internalLinks = new Map();     // target -> first source

const expectLang = (path) => (/^\/(es)(\/|$)/.exec(path)?.[1]) || 'en';

function ldNodes(html, path) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); out.push(...(j['@graph'] ?? [j])); } catch (e) { fail(path, `JSON-LD does not parse: ${e.message}`); }
  }
  return out;
}

function checkPage(path, { status, html, headers }, { indexable }) {
  if (status !== 200) return fail(path, `status ${status}`);
  const title = decode(/<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').trim();
  const desc = meta(html, 'description');
  const robots = meta(html, 'robots') ?? '';
  const noindex = /noindex/i.test(robots);

  // Indexing directives agree with the sitemap
  if (indexable && noindex) fail(path, 'is in the sitemap but has noindex');
  if (!indexable && !noindex && !/^\/(api|dashboard|login|premium)/.test(path) && inSitemap.size) warn(path, 'indexable but not in the sitemap');
  if (noindex) return;   // private/withheld pages only need the directive

  // Title & description
  if (!title) fail(path, 'missing <title>');
  else { if (title.length > 60) fail(path, `title is ${title.length} chars (>60): "${title}"`); if (/\| Ava \| Ava/.test(title)) fail(path, `brand repeated in title: "${title}"`); titles.set(title, [...(titles.get(title) ?? []), path]); }
  if (!desc) fail(path, 'missing meta description');
  else { if (desc.length > 155) fail(path, `description is ${desc.length} chars (>155)`); if (desc.length < 70) warn(path, `description is short (${desc.length} chars)`); descs.set(desc, [...(descs.get(desc) ?? []), path]); }

  // Headings
  const hs = [...html.matchAll(/<h([1-6])\b[^>]*>/g)].map(m => Number(m[1]));
  if (hs.filter(h => h === 1).length !== 1) fail(path, `has ${hs.filter(h => h === 1).length} <h1> (want exactly 1)`);
  hs.forEach((h, i) => { if (i > 0 && h > hs[i - 1] + 1) fail(path, `heading level skips from h${hs[i - 1]} to h${h}`); });
  if (/\blevel="\d"/.test(html)) fail(path, 'stray level="…" attribute in markup');

  // Document basics
  const lang = /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1];
  if (!lang) fail(path, '<html> has no lang'); else if (lang !== expectLang(path)) fail(path, `<html lang="${lang}"> but the page is ${expectLang(path)}`);
  if (!meta(html, 'viewport')) fail(path, 'missing viewport meta');
  const canon = tags(html, /<link\b[^>]*>/gi).find(t => attr(t, 'rel') === 'canonical');
  const canonHref = canon && attr(canon, 'href');
  if (!canonHref) fail(path, 'missing canonical'); else {
    if (!/^https?:\/\//.test(canonHref)) fail(path, `canonical is not absolute: ${canonHref}`);
    const cp = local(toBase(canonHref)); const want = path.replace(/\?.*$/, '').replace(/(.)\/$/, '$1');
    if (cp !== want) fail(path, `canonical points elsewhere: ${canonHref}`);
  }

  // Social
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale', 'og:type']) if (!meta(html, k, 'property')) fail(path, `missing ${k}`);
  if (meta(html, 'twitter:card') !== 'summary_large_image') fail(path, 'twitter:card is not summary_large_image');
  const loc = meta(html, 'og:locale'); if (loc && !/^[a-z]{2}_[A-Z]{2}$/.test(loc)) fail(path, `og:locale "${loc}" should look like en_US`);

  // Images
  for (const img of tags(html, /<img\b[^>]*>/gi)) if (attr(img, 'alt') === null) fail(path, `<img> without alt: ${img.slice(0, 80)}`);

  // Structured data
  const nodes = ldNodes(html, path);
  if (!nodes.length) fail(path, 'no JSON-LD');
  const ids = new Set(nodes.map(n => n['@id']).filter(Boolean));
  const types = (n) => [].concat(n['@type'] ?? []);
  if (!nodes.some(n => types(n).includes('Organization'))) fail(path, 'JSON-LD has no Organization');
  if (!nodes.some(n => types(n).includes('WebSite'))) fail(path, 'JSON-LD has no WebSite');
  const refs = []; (function walk(v) { if (v && typeof v === 'object') { if (Object.keys(v).length === 1 && v['@id']) refs.push(v['@id']); Object.values(v).forEach(walk); } })(nodes.map(n => ({ ...n, '@id': undefined })));
  for (const r of refs) if (!ids.has(r)) fail(path, `JSON-LD references ${r} but no such node exists`);
  const visible = text(html);
  for (const n of nodes) {
    if (types(n).includes('BreadcrumbList')) {
      n.itemListElement.forEach((it, i) => { if (it.position !== i + 1) fail(path, 'breadcrumb positions are not sequential'); });
      const names = [...html.matchAll(/aria-label="Breadcrumb"[\s\S]*?<\/nav>/g)][0]?.[0] ?? '';
      if (!names) fail(path, 'JSON-LD breadcrumbs but no visible breadcrumb nav');
    }
    if (types(n).includes('FAQPage')) for (const q of n.mainEntity ?? []) {
      if (!visible.includes(text(q.name).slice(0, 40))) fail(path, `FAQ question not visible on the page: "${q.name.slice(0, 50)}"`);
      if (!visible.includes(text(q.acceptedAnswer.text).slice(0, 40))) fail(path, `FAQ answer not visible on the page: "${q.name.slice(0, 50)}"`);
    }
    if (types(n).includes('Article')) {
      for (const k of ['headline', 'datePublished', 'dateModified', 'image', 'author', 'publisher', 'mainEntityOfPage']) if (!n[k]) fail(path, `Article missing ${k}`);
      if (n.headline && n.headline.length > 110) fail(path, 'Article headline over 110 chars');
      if (n.headline && !visible.includes(n.headline.slice(0, 40))) fail(path, 'Article headline is not on the page');
    }
  }

  // Links
  for (const a of tags(html, /<a\b[^>]*>/gi)) {
    const href = attr(a, 'href'); if (!href || /^(mailto:|tel:|#|javascript:)/.test(href)) continue;
    const p = local(href); if (p && !internalLinks.has(p)) internalLinks.set(p, path);
    if (/^https?:\/\//.test(href) && !p && attr(a, 'target') === '_blank' && !/noopener/.test(attr(a, 'rel') ?? '')) fail(path, `external link opens a new tab without rel=noopener: ${href}`);
  }
}

async function main() {
  console.log(`Auditing ${BASE}\n`);
  await readSitemaps();

  const extra = ['/', '/privacy', '/terms', '/tools', '/blog', '/login', '/dashboard', '/premium/success', '/es', '/es/herramientas', '/this-page-does-not-exist'];
  const targets = new Set([...sitemapPages.keys(), ...extra]);
  for (const path of targets) {
    const r = await get(BASE + path); const html = r.status === 200 ? await r.text() : (r.status === 404 ? await r.text() : '');
    pages.set(path, { status: r.status, html, headers: r.headers });
  }
  for (const [path, page] of pages) {
    if (path === '/this-page-does-not-exist') {
      if (page.status !== 404) fail(path, `unknown URL returns ${page.status}, want 404`);
      if (page.html && !/noindex/i.test(meta(page.html, 'robots') ?? '')) warn(path, '404 page is missing noindex');
      continue;
    }
    if (!inSitemap.has(path) && ['/login', '/dashboard', '/premium/success'].includes(path)) {
      if (page.status === 200 && !/noindex/i.test(meta(page.html, 'robots') ?? '')) fail(path, 'private page is missing noindex');
      continue;
    }
    checkPage(path, page, { indexable: inSitemap.has(path) });
  }

  // hreflang: every alternate must exist, link back, and (for x-default) be English
  for (const [path, { alts }] of sitemapPages) {
    if (!Object.keys(alts).length) continue;
    for (const [l, target] of Object.entries(alts)) {
      if (!pages.has(target)) { fail(path, `hreflang ${l} → ${target} is not in the sitemap`); continue; }
      const back = sitemapPages.get(target)?.alts ?? {};
      const mine = Object.values(back);
      if (!mine.includes(path)) fail(path, `hreflang ${l} → ${target} does not link back (not reciprocal)`);
      const html = pages.get(target).html;
      const pageAlts = tags(html, /<link\b[^>]*>/gi).filter(t => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang'));
      if (!pageAlts.length) fail(target, 'in an hreflang group in the sitemap but the page itself has no hreflang links');
    }
  }
  // unique titles/descriptions
  for (const [t, ps] of titles) if (ps.length > 1) fail(ps.join(', '), `duplicate title "${t}"`);
  for (const [d, ps] of descs) if (ps.length > 1) fail(ps.join(', '), 'duplicate meta description');

  // internal links resolve
  for (const [target, src] of internalLinks) {
    if (pages.has(target)) { if (pages.get(target).status >= 400) fail(src, `links to ${target} (status ${pages.get(target).status})`); continue; }
    const r = await get(BASE + target.split('#')[0]);
    if (r.status >= 400 || r.status === 0) fail(src, `broken internal link ${target} (status ${r.status})`);
    else if (r.status >= 300) warn(src, `link ${target} redirects (${r.status})`);
  }

  // robots, manifest, icons, share images
  const robots = await (await get(`${BASE}/robots.txt`)).text();
  if (!/^Sitemap:\s*\S+/mi.test(robots)) fail('/robots.txt', 'has no Sitemap line');
  if (/Disallow:\s*\/\s*$/m.test(robots.split(/User-agent:/i).find(b => /^\s*\*/.test(b)) ?? '')) fail('/robots.txt', 'blocks the whole site for *');
  const home = pages.get('/')?.html ?? '';
  const assets = new Set(['/favicon.ico', '/logo.png', '/og-image.png', '/twitter-card.png', '/apple-touch-icon.png', '/site.webmanifest']);
  for (const t of tags(home, /<link\b[^>]*>/gi)) { const h = attr(t, 'href'); if (h && /icon|manifest/.test(attr(t, 'rel') ?? '')) assets.add(local(h)); }
  const og = meta(home, 'og:image', 'property'); if (og) assets.add(local(og));
  for (const a of assets) { const r = await get(BASE + a); if (r.status !== 200) fail(a, `asset status ${r.status}`); }
  if (!/rel="icon"/.test(home)) fail('/', 'no <link rel="icon">');
  if (!/rel="manifest"/.test(home)) fail('/', 'no <link rel="manifest">');
  const h = pages.get('/')?.headers; if (h?.get('x-powered-by')) warn('/', 'X-Powered-By header is exposed');
  for (const k of ['x-content-type-options', 'referrer-policy']) if (h && !h.get(k)) warn('/', `missing ${k} header`);
  const cc = pages.get('/')?.headers.get('cache-control') ?? '';
  if (/no-store|private/.test(cc) || /max-age=0, must-revalidate/.test(cc) && !/s-maxage/.test(cc)) warn('/', `home page is not CDN-cacheable (cache-control: ${cc})`);

  console.log(`Checked ${pages.size} pages, ${internalLinks.size} internal links, ${assets.size} assets, ${inSitemap.size} sitemap URLs.\n`);
  if (warnings.length) console.log(`Warnings (${warnings.length}):\n  ${warnings.join('\n  ')}\n`);
  if (failures.length) { console.log(`FAILED (${failures.length}):\n  ${failures.join('\n  ')}\n`); process.exit(1); }
  console.log('All SEO checks passed.');
}
main().catch(e => { console.error(e); process.exit(2); });
