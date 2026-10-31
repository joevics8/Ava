# Ava — content site standards

Telegram (@Ava_care_bot) is the product. The website is the front door: tools, blog and a dashboard. **Every CTA points to Telegram.** No ads inside chat, dashboard or login.

## Architecture (copied from naira.autos, made data-driven)
- English at root; other languages under `/{lang}/` with a translated hub segment (`/es/herramientas/...`). All URL building goes through `lib/site.ts` — never hand-write a path.
- Tools are data in `lib/tools/registry.ts`; pages are generic (`components/site/views.tsx`). Adding a tool/language is a data change, not a new page file.
- Blog lives in Supabase `blog_posts`; `/api/cron/publish-blogs` releases queued drafts (cap `BLOG_DAILY_CAP`/day) and pings IndexNow.
- Sitemap = index → `sitemap-static.xml` + `sitemap-blogs.xml`. A non-English hub/home is withheld from the sitemap (and noindexed) until the language has `HUB_MIN_PAGES` tools.

## Page checklist (every new tool/page)
1. Unique `<title>` ≤ 60 chars and meta description ≤ 155, written natively in that language.
2. `pageMetadata()` for canonical + reciprocal hreflang + x-default.
3. JSON-LD `@graph`: WebPage + BreadcrumbList (+ FAQPage, + SoftwareApplication/Article).
4. Visible breadcrumbs, 4+ FAQs, related tools, Telegram CTA, medical disclaimer in the footer.
5. `prefetch={false}` on internal links; ISR `revalidate` set (limits Vercel usage).

## Health-data privacy (non-negotiable)
- Calculator inputs stay in component state: never in URLs, query strings, analytics events, logs or ad targeting.
- Ads load only through `components/site/ConsentAndAds.tsx` (Consent Mode v2, default denied). Never mount it on `/dashboard`, `/login` or the chat.
- Content is general wellness information, not diagnosis. Keep the disclaimer.

## Adding a language
1. Write every UI string in `lib/ui-strings.ts` and every tool's text natively (no raw machine output pasted in).
2. Add the code to `ENABLED_LANGS` in `lib/site.ts` only when its tools exist.
3. Check the sitemap and a page's hreflang tags in both directions.
4. Release in waves; watch Search Console before the next wave.

## Blog drafts
Drafts are inserted as `published=false` and **reviewed by a human** before the cron can release them. The cron never generates text.
