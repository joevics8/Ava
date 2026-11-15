import { supabase } from '@/lib/supabase';
import type { Lang } from '@/lib/site';
import type { Tool, ToolText } from './types';
import { findTool } from './registry';

// Tool copy lives in code (lib/tools) as the default. /admin can override the
// text fields per tool + language in Supabase `tool_content`; any field left
// empty falls back to the code copy, and deleting the row reverts the page.
// The slug and the calculator itself always come from code.

export interface ToolContentRow {
  tool_id: string;
  language: string;
  title: string | null;
  h1: string | null;
  description: string | null;
  intro: string | null;
  article: string | null;
  faqs: unknown;
  reviewed_by: unknown;
  updated_at?: string | null;
}

export const TOOL_CONTENT_COLS = 'tool_id,language,title,h1,description,intro,article,faqs,reviewed_by,updated_at';

const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);

export function parseFaqs(v: unknown): { q: string; a: string }[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.flatMap(x => (x && typeof x.q === 'string' && typeof x.a === 'string' && x.q.trim() && x.a.trim() ? [{ q: x.q, a: x.a }] : []));
  return out.length ? out : undefined;
}

/** A reviewer only counts when name, credentials and date are all present. */
export function parseReviewer(v: unknown): ToolText['reviewedBy'] | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const r = v as Record<string, unknown>;
  const name = text(r.name), credentials = text(r.credentials), date = text(r.date);
  if (!name || !credentials || !date) return undefined;
  const url = text(r.url);
  return { name, credentials, date, ...(url ? { url } : {}) };
}

export function mergeToolText(base: ToolText, row: Partial<ToolContentRow> | null | undefined): ToolText {
  if (!row) return base;
  return {
    ...base,
    title: text(row.title) ?? base.title,
    h1: text(row.h1) ?? base.h1,
    description: text(row.description) ?? base.description,
    intro: text(row.intro) ?? base.intro,
    article: text(row.article) ?? base.article,
    faqs: parseFaqs(row.faqs) ?? base.faqs,
    reviewedBy: parseReviewer(row.reviewed_by) ?? base.reviewedBy,
  };
}

/** Never throws: if Supabase or the table is unavailable the page uses the code copy. */
export async function getToolOverride(toolId: string, lang: Lang): Promise<ToolContentRow | null> {
  try {
    const { data, error } = await supabase.from('tool_content').select(TOOL_CONTENT_COLS).eq('tool_id', toolId).eq('language', lang).maybeSingle();
    if (error) { console.error('getToolOverride', error.message); return null; }
    return (data as ToolContentRow) ?? null;
  } catch (e) { console.error('getToolOverride', e); return null; }
}

/** Like findTool, with any /admin edits applied. */
export async function resolveTool(lang: Lang, slug: string): Promise<{ tool: Tool; text: ToolText } | null> {
  const hit = findTool(lang, slug);
  if (!hit) return null;
  const row = await getToolOverride(hit.tool.id, lang);
  return { tool: hit.tool, text: mergeToolText(hit.text, row) };
}
