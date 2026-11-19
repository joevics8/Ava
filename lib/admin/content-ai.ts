import { z } from 'zod';

// Pure helpers for the /admin writer/parser: prompts, output schema, cleanup and
// validation. No network or database access here, so all of it is unit-tested.

export type JobMode = 'parse' | 'rewrite' | 'write';
export type JobKind = 'blog' | 'tool';

export interface Faq { q: string; a: string }

/** One shape for every job. Tools map: meta_description → description, excerpt → intro, body → article. */
export interface ContentResult {
  title: string;
  meta_description: string;
  excerpt: string;
  body: string;
  faqs: Faq[];
  slug: string;
  category: string;
  related_tool_ids: string[];
}

export interface JobInput {
  mode: JobMode;
  kind: JobKind;
  language: string;
  keywords?: string;
  instructions?: string;
  targetWords?: number;
  topic?: string;
  title?: string;
  body?: string;
  meta_description?: string;
  excerpt?: string;
  faqs?: Faq[];
  /** Valid internal tools the AI may link to, as { id, title }. */
  tools?: { id: string; title: string }[];
}

export const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    meta_description: { type: 'string' },
    excerpt: { type: 'string' },
    body: { type: 'string' },
    faqs: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'] } },
    slug: { type: 'string' },
    category: { type: 'string' },
    related_tool_ids: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'meta_description', 'excerpt', 'body', 'faqs', 'slug', 'category', 'related_tool_ids'],
} as const;

const ResultZ = z.object({
  title: z.string().default(''),
  meta_description: z.string().default(''),
  excerpt: z.string().default(''),
  body: z.string().min(1),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  slug: z.string().default(''),
  category: z.string().default(''),
  related_tool_ids: z.array(z.string()).default([]),
});

export function parseResult(raw: unknown): ContentResult {
  return ResultZ.parse(raw);
}

// ── Text utilities ──────────────────────────────────────────────────────────

/** Words in Markdown prose (syntax characters, link targets and code blocks are not counted). */
export function countWords(md: string): number {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~]+/g, ' ');
  return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

export const readTimeMinutes = (words: number) => Math.max(1, Math.ceil(words / 220));

export function slugify(input: string): string {
  return input
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/g, '');
}

/** Cut a meta description to fit, on a word boundary, without an ellipsis. */
export function fitMeta(s: string, max = 155): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const at = cut.lastIndexOf(' ');
  return (at > 40 ? cut.slice(0, at) : t.slice(0, max)).replace(/[\s,;:\-–—]+$/, '');
}

const PLACEHOLDER_INLINE = /\[(?:insert|add|link|stat|citation|source|todo)[^\]]*\]|\bTODO\b|\bTK\b|\{\{[^}]*\}\}/i;

/**
 * Deterministic safety net for AI/editor leftovers: word-count notes, "Here is the
 * article" preambles, "let me know" sign-offs, placeholder-only lines, a duplicate H1.
 * It only ever removes whole lines/paragraphs that are clearly not article content.
 */
export function stripEditorNoise(md: string): string {
  let lines = md.replace(/\r\n/g, '\n').split('\n');

  lines = lines.filter(l => {
    const t = l.trim();
    if (/^[*_(\[]*\s*(word count|words?|total words?|character count)\s*[:=]\s*[*_]*\s*[\d,.]+[^\n]*$/i.test(t)) return false;
    if (/^[*_(\[]*\s*(note to (the )?editor|editor'?s note|seo note|keyword note)\b/i.test(t)) return false;
    if (/^(?:\[?\s*(?:TK|TODO)\s*\]?)[:\s]*$/i.test(t)) return false;
    return true;
  });

  // A short opening line that is just a preamble ("Here is the rewritten article:").
  const first = lines.findIndex(l => l.trim());
  if (first >= 0) {
    const t = lines[first].trim();
    if (t.length < 160 && /^(here(?:'s| is| are)|below is|sure\b|certainly\b|okay\b|of course\b)/i.test(t) && (/[:：]$/.test(t) || /\b(article|post|rewrite|rewritten|version|draft|content)\b/i.test(t))) {
      lines.splice(first, 1);
    }
  }

  // A closing sign-off paragraph.
  let end = lines.length - 1;
  while (end >= 0 && !lines[end].trim()) end--;
  if (end >= 0 && /^(let me know|i hope this|hope this helps|feel free to|would you like me to)/i.test(lines[end].trim())) lines.splice(end, 1);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** The page renders the title as its h1, so a leading "# Title" in the body would duplicate it. */
export function dropLeadingH1(md: string): { text: string; dropped: boolean } {
  const m = /^\s*#\s+[^\n]+\n+/.exec(md);
  return m ? { text: md.slice(m[0].length), dropped: true } : { text: md, dropped: false };
}

export function externalLinks(md: string): string[] {
  return Array.from(md.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)).map(m => m[1]);
}

export function findPlaceholders(md: string): string[] {
  return md.split('\n').filter(l => PLACEHOLDER_INLINE.test(l)).map(l => l.trim().slice(0, 80));
}

// ── Prompts ─────────────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish' };
export const languageName = (code: string) => LANGUAGE_NAMES[code] ?? code;

const SITE_RULES = `SITE: Verm (Verm.app) is a free women's-health and wellness site (calculators and articles) for the general public. Write in plain, warm, direct language. The audience is global with a strong Nigerian base; use the reader's own wording where natural.

HARD RULES (these override everything else):
1. Never invent facts. No statistics, percentages, study or journal names, guideline versions, quotes, product claims, dates or URLs that are not already in the SOURCE. You may add widely established general health explanation, framed as general guidance.
2. No fake authority. Never say or imply that a doctor, clinician or named person wrote, reviewed or endorsed this. No testimonials or customer reviews. Do not write a medical-disclaimer section: the page shows its own.
3. Keep every number, threshold, timeline and safety instruction from the SOURCE exactly. Never soften or drop "see a clinician" or urgent-care advice. Where a topic can be an emergency, say when to get urgent help.
4. No diagnosis and no treatment or dosing instructions beyond what the SOURCE already says.
5. Markdown only: ## and ### headings (never a single-# h1: the page supplies the title), short paragraphs, bullets only where they help. No HTML, no emojis, no editor commentary, no word counts, no notes about keywords or SEO choices.
6. Use keywords naturally: in the title, meta description, first paragraph and a few headings. Never stuff them or repeat a phrase unnaturally.`;

function toolList(tools?: { id: string; title: string }[]): string {
  if (!tools?.length) return '(none)';
  return tools.map(t => `- ${t.id}: ${t.title}`).join('\n');
}

function wordsRule(target?: number): string {
  if (!target) return 'Length: keep roughly the same length as the SOURCE.';
  return `Length: the body must be ${Math.round(target * 0.95)}-${Math.round(target * 1.1)} words. If you reach a natural end early, add another genuinely useful section (a worked example, common mistakes, myths vs facts, when to seek help) instead of padding.`;
}

function faqsBlock(faqs?: Faq[]): string {
  return faqs?.length ? JSON.stringify(faqs) : '[]';
}

export function buildParsePrompt(i: JobInput): string {
  return `You are a precise editor. DO NOT rewrite, summarise, paraphrase or reword the article. You may only make surgical ("scissors") edits. Keep every heading, table, list, quote, paragraph and the author's exact wording.

LANGUAGE OF THE ARTICLE: ${languageName(i.language)}

Return JSON with these fields:
1. "title": the article's main title as plain text (no markdown). If the TITLE below is not empty, use it.
2. "slug": a short kebab-case ASCII url slug from the title (3-8 words, no stop-word padding).
3. "category": ONE short kebab-case category inferred from the content (e.g. "periods", "pregnancy", "fertility", "contraception", "baby-care", "sexual-health", "lab-tests", "wellness").
4. "related_tool_ids": ids from the TOOLS list below that are clearly relevant (max 4). Empty array if none. Never invent an id.
5. "excerpt": a 1-2 sentence teaser from the intro, max 200 characters, plain text.
6. "meta_description": max 155 characters, plain text, includes the main topic.
7. "faqs": if the source already has an FAQ / "Frequently asked questions" section, move each question and answer into this array (plain text answers) and remove that section from the body. Otherwise return [].
8. "body": the SAME markdown with ONLY these scissors edits:
   a. LINK CLEANUP. Sources often end sentences with bare citation-style links such as "...for Nigerian businesses. [nitda.gov](https://nitda.gov.ng/x)". These are not natural. Keep at most the 5 best, most authoritative external links in the WHOLE article (official bodies and primary sources first) and delete every other trailing bare-domain citation, including orphaned spaces or punctuation, keeping the sentence intact. Rewrite each kept link as an inline anchor on a noun phrase already in that sentence (e.g. "for [Nigerian businesses](https://nitda.gov.ng/x)."). Do not invent sentences. If no sensible noun phrase exists, drop that link. Relative/internal links are not counted and stay.
   b. REMOVE EDITOR/AI COMMENTARY completely: word-count notes, TK/TODO and "[insert stat]" placeholders (delete the placeholder line; if it is mid-sentence, remove only the placeholder), explanations of keyword or heading choices, "Here is the article:" preambles, "Let me know if..." sign-offs, stray HTML tags, duplicated headings and leftover prompt fragments.
   c. If the body starts with a single-# title identical to the title, remove that line (the page shows the title).
   d. Do NOT change any other wording. A paragraph with no defect is returned verbatim.

TOOLS (valid ids):
${toolList(i.tools)}

TITLE (may be empty):
${i.title ?? ''}

CONTENT:
${i.body ?? ''}`;
}

export function buildRewritePrompt(i: JobInput): string {
  const tool = i.kind === 'tool';
  const fields = tool
    ? `Return JSON with these fields:
- "title": the page title, max 55 characters, leads with the main keyword. Keep the tool's name.
- "meta_description": max 155 characters, plain text, benefit-led, includes the main keyword.
- "excerpt": the one-to-two sentence intro shown above the calculator, max 250 characters, plain text.
- "body": the "about this tool" article in Markdown. Cover, in a natural order: what it is, how the tool works, how to read the result, typical ranges or timelines, common mistakes, myths vs facts, when to see a clinician or get urgent help. End with a "## Limits" section.
- "faqs": 5-6 question-and-answer pairs people really search (plain text answers, 1-3 sentences each). Keep existing questions that match search intent, rewrite weak answers, add new ones as needed.
- "slug": "" and "category": "" and "related_tool_ids": [] (not used for tools).`
    : `Return JSON with these fields:
- "title": max 65 characters, leads with the main keyword, honest and not clickbait.
- "meta_description": max 155 characters, plain text.
- "excerpt": 1-2 sentence teaser, max 200 characters, plain text.
- "body": the article in Markdown, structured with ## headings that match what people search (questions and long-tail phrases work well as headings).
- "faqs": 4-6 question-and-answer pairs drawn from the article's topic (plain text, 1-3 sentences each). Do not repeat them inside the body.
- "slug": keep the current slug if one is given in INSTRUCTIONS, otherwise a short kebab-case ASCII slug.
- "category": one short kebab-case category.
- "related_tool_ids": ids from TOOLS that are clearly relevant (max 4), never invented.`;

  return `You are a careful SEO editor improving ${tool ? 'the copy of a calculator page' : 'a blog article'} for Verm. Fix keyword targeting, search intent, structure and depth WITHOUT destroying the facts, figures and safety advice already in the SOURCE.

${SITE_RULES}

WRITE IN: ${languageName(i.language)} (natively, not translated word-for-word)
${wordsRule(i.targetWords)}

KEYWORDS TO TARGET (first is primary):
${i.keywords?.trim() || '(none given: infer them from the SOURCE)'}

EXTRA INSTRUCTIONS:
${i.instructions?.trim() || '(none)'}

${fields}

TOOLS (valid ids for related_tool_ids):
${toolList(i.tools)}

SOURCE TITLE:
${i.title ?? ''}

SOURCE META DESCRIPTION:
${i.meta_description ?? ''}

SOURCE INTRO / EXCERPT:
${i.excerpt ?? ''}

SOURCE FAQS (JSON):
${faqsBlock(i.faqs)}

SOURCE BODY:
${i.body ?? ''}`;
}

export function buildWritePrompt(i: JobInput): string {
  return `You are a health-content writer for Verm. Write a new blog article from the BRIEF below. It will be reviewed and edited by a human before it is published.

${SITE_RULES}

Because you must not invent facts: write only widely established general information. If the topic seems to need specific figures, prices, laws, statistics or named studies that you cannot be certain of, leave them out and keep that part general.

WRITE IN: ${languageName(i.language)} (natively)
${wordsRule(i.targetWords ?? 1200)}

BRIEF / TOPIC:
${i.topic ?? ''}

KEYWORDS TO TARGET (first is primary):
${i.keywords?.trim() || '(none given: infer them from the topic)'}

EXTRA INSTRUCTIONS:
${i.instructions?.trim() || '(none)'}

Return JSON with these fields:
- "title": max 65 characters, leads with the main keyword, honest and not clickbait.
- "meta_description": max 155 characters, plain text.
- "excerpt": 1-2 sentence teaser, max 200 characters, plain text.
- "body": the article in Markdown. Open with a short direct answer to the searcher's question, then ## sections (what it is, how it works or what to expect, common mistakes, myths vs facts, when to see a clinician or get urgent help). End with a short "## Takeaways" section.
- "faqs": 4-6 question-and-answer pairs (plain text, 1-3 sentences). Do not repeat them inside the body.
- "slug": short kebab-case ASCII slug.
- "category": one short kebab-case category.
- "related_tool_ids": ids from TOOLS that are clearly relevant (max 4), never invented.

TOOLS (valid ids):
${toolList(i.tools)}`;
}

export function buildPrompt(i: JobInput): string {
  if (i.mode === 'parse') return buildParsePrompt(i);
  if (i.mode === 'write') return buildWritePrompt(i);
  return buildRewritePrompt(i);
}

// ── Post-processing and validation ──────────────────────────────────────────

export interface Finished { result: ContentResult; warnings: string[]; words: number }

/** Clean the AI output, enforce hard limits, and list what a human should look at. */
export function finish(raw: ContentResult, input: JobInput): Finished {
  const warnings: string[] = [];
  const clean = (s: string) => s.replace(/[*_`#]+/g, '').replace(/\s+/g, ' ').trim();

  let body = stripEditorNoise(raw.body);
  const h1 = dropLeadingH1(body);
  body = h1.text;
  if (h1.dropped) warnings.push('Removed a leading # title from the body (the page shows the title).');

  const result: ContentResult = {
    ...raw,
    title: clean(raw.title) || clean(input.title ?? ''),
    meta_description: fitMeta(clean(raw.meta_description)),
    excerpt: clean(raw.excerpt),
    body,
    faqs: raw.faqs.map(f => ({ q: clean(f.q), a: f.a.replace(/\s+/g, ' ').trim() })).filter(f => f.q && f.a),
    slug: slugify(raw.slug || raw.title),
    category: slugify(raw.category),
    related_tool_ids: [],
  };

  const valid = new Set((input.tools ?? []).map(t => t.id));
  result.related_tool_ids = Array.from(new Set(raw.related_tool_ids)).filter(id => valid.has(id)).slice(0, 4);

  const tool = input.kind === 'tool';
  if (clean(raw.meta_description).length > 155) warnings.push('Meta description was longer than 155 characters and was trimmed. Check it still reads well.');
  if (!result.meta_description) warnings.push('No meta description was produced.');
  if (tool && result.title.length > 60) warnings.push(`Title is ${result.title.length} characters (aim for 60 or fewer).`);
  if (!tool && result.title.length > 70) warnings.push(`Title is ${result.title.length} characters (aim for about 65 or fewer).`);
  if (tool && result.faqs.length < 4) warnings.push('Fewer than 4 FAQs. The site checklist asks for 4 or more.');
  if (!/^##\s/m.test(body)) warnings.push('The body has no ## headings.');
  const placeholders = findPlaceholders(body);
  if (placeholders.length) warnings.push(`Placeholder text left in the body: ${placeholders.slice(0, 3).join(' | ')}`);
  const links = externalLinks(body);
  if (links.length > 5) warnings.push(`${links.length} external links in the body (the parser keeps 5 at most).`);

  const words = countWords(body);
  if (input.targetWords && words < input.targetWords * 0.85) warnings.push(`Body is ${words} words, below the ${input.targetWords}-word target.`);
  if (input.mode === 'parse' && input.body) {
    const before = countWords(input.body);
    if (before > 0 && words < before * 0.7) warnings.push(`The parser removed ${Math.round((1 - words / before) * 100)}% of the words (${before} to ${words}). Compare with your original before saving.`);
  }
  if (input.mode !== 'parse') warnings.push('AI wrote or reworded this text. Check every medical statement before saving.');

  return { result, warnings, words };
}
