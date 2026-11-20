// Automatic quality and safety checks for a blog draft. Pure: no database, no AI.
// A draft is released only when it has no "fail" results. Thresholds are env-tunable.

export interface CheckInput {
  slug: string; language: string; title: string; excerpt: string | null; meta_description: string | null;
  content: string; faqs: unknown; read_time?: number | null;
}
export interface CheckResult { ok: boolean; reasons: string[] }

const num = (v: string | undefined, d: number) => (Number(v) > 0 ? Number(v) : d);
export const limits = () => ({
  minWords: num(process.env.BLOG_MIN_WORDS, 400),
  maxWords: num(process.env.BLOG_MAX_WORDS, 4500),
  minH2: num(process.env.BLOG_MIN_HEADINGS, 2),
  minFaqs: num(process.env.BLOG_MIN_FAQS, 3),
});

const PLACEHOLDERS = /\[(insert|add|todo|tbd|link|image|source|citation)[^\]]*\]|\bTODO\b|\bTBD\b|lorem ipsum|\{\{|\}\}|\bundefined\b|\bNaN\b|\[\s*\]/i;
const AI_TELLS = /as an ai\b|language model|i('| a)m (just )?an ai|i cannot (provide|assist|help)|here('| i)s (the|your|an?) (article|blog|post)|certainly!|sure, here|```/i;
// Claims that should never go out unreviewed on a health site.
const RISKY = [
  { re: /\b(cures?|cured|curing)\b(?! rate)/i, why: 'claims something cures a condition' },
  { re: /\bguarantee[sd]?\b/i, why: 'uses "guarantee"' },
  { re: /\bmiracle\b/i, why: 'uses "miracle"' },
  { re: /\b100\s?%\s*(safe|effective|natural|accurate)/i, why: 'claims 100% safe/effective' },
  { re: /\b(stop|quit|skip) (taking )?(your )?(medication|medicine|prescription|pills)\b/i, why: 'tells the reader to stop medication' },
  { re: /\byou (definitely |certainly )?(have|are suffering from) (cancer|pcos|endometriosis|diabetes|an? (infection|std|sti))\b/i, why: 'diagnoses the reader' },
];

export function wordCount(s: string): number {
  return (s.replace(/[#*_`>|-]+/g, ' ').match(/\S+/g) ?? []).length;
}

/** Normalised title for duplicate detection. */
export const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9À-￿]+/g, ' ').trim();

export function checkDraft(d: CheckInput, ctx: { otherTitles?: ReadonlySet<string> } = {}): CheckResult {
  const L = limits();
  const reasons: string[] = [];
  const title = (d.title ?? '').trim(), body = d.content ?? '';

  if (title.length < 20 || title.length > 70) reasons.push(`Title is ${title.length} characters (needs 20-70).`);
  const meta = (d.meta_description ?? '').trim();
  if (meta.length < 70 || meta.length > 160) reasons.push(`Meta description is ${meta.length} characters (needs 70-160).`);
  if (!(d.excerpt ?? '').trim()) reasons.push('Missing excerpt.');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) reasons.push('Slug has odd characters.');

  const words = wordCount(body);
  if (words < L.minWords) reasons.push(`Only ${words} words (minimum ${L.minWords}).`);
  if (words > L.maxWords) reasons.push(`${words} words is unusually long (maximum ${L.maxWords}).`);

  const h2 = (body.match(/^##\s+\S/gm) ?? []).length + (body.match(/<h2[\s>]/gi) ?? []).length;
  if (h2 < L.minH2) reasons.push(`Only ${h2} section headings (minimum ${L.minH2}).`);
  if (/^#\s+\S/m.test(body)) reasons.push('Body contains a # title; the page already shows the title.');

  const faqs = Array.isArray(d.faqs) ? (d.faqs as { q?: string; a?: string }[]) : [];
  const goodFaqs = faqs.filter(f => f && String(f.q ?? '').trim().length > 8 && String(f.a ?? '').trim().length > 20);
  if (goodFaqs.length < L.minFaqs) reasons.push(`Only ${goodFaqs.length} complete FAQs (minimum ${L.minFaqs}).`);

  const all = `${title}\n${meta}\n${body}\n${faqs.map(f => `${f?.q} ${f?.a}`).join('\n')}`;
  const ph = all.match(PLACEHOLDERS); if (ph) reasons.push(`Leftover placeholder text: "${ph[0].slice(0, 30)}".`);
  const ai = all.match(AI_TELLS); if (ai) reasons.push(`Looks like AI chatter: "${ai[0].slice(0, 30)}".`);
  for (const r of RISKY) { const m = all.match(r.re); if (m) reasons.push(`Risky health wording ("${m[0]}"): ${r.why}.`); }

  // The same sentence over and over means the model looped.
  const sentences = body.split(/(?<=[.!?])\s+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 40);
  const seen = new Map<string, number>();
  for (const s of sentences) seen.set(s, (seen.get(s) ?? 0) + 1);
  if (Array.from(seen.values()).some(n => n >= 3)) reasons.push('A long sentence is repeated 3 or more times.');

  if (ctx.otherTitles?.has(titleKey(title))) reasons.push('Another post already has this title.');

  return { ok: reasons.length === 0, reasons };
}
