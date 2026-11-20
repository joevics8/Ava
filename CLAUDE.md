# Verm — content site standards (the bot is called Ava)

Brand: the website is **Verm** (Verm.app); **Ava** is only the name of the Telegram bot (@Ava_care_bot). Telegram is the product. The website is the front door: tools, blog and a dashboard. **Every CTA points to Telegram.** No ads inside chat, dashboard or login.

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
Drafts are inserted as held (`published=false`, `review_hold=true`). `/api/cron/approve-blogs` (cron-job.org, no secret) runs automatic checks (`lib/admin/blog-checks.ts`: length, headings, meta, FAQs, placeholders, AI chatter, risky health wording, repeats, duplicate titles), releases drafts that pass, and publishes released drafts at `BLOG_DAILY_CAP` per day. Drafts that fail stay held with the reasons in `auto_check_notes` (shown in /admin/blog) and are re-checked only after an edit. The cron never generates text.

## Admin
`/admin` needs a Supabase Auth user with `app_metadata.role = 'admin'` (no signup; create users in the Supabase dashboard). See `lib/admin/auth.ts`.
