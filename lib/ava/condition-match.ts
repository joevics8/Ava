import { supabaseAdmin } from '@/lib/supabase';
import { embedText, toPgVector } from './embeddings';

// Meaning-based fallback for symptom -> remedy condition. Only used when the word matcher
// finds nothing. A wrong match is worse than a miss, so the bar is deliberately high.

export const conditionMin = () => Number(process.env.CONDITION_MATCH_MIN) || 0.72;
export const conditionMargin = () => Number(process.env.CONDITION_MATCH_MARGIN) || 0.02;

// Serious / diagnostic conditions are never suggested from a fuzzy match.
export const SEMANTIC_EXCLUDE = new Set([
  'endometriosis_pain', 'fibroid_symptoms', 'ovarian_cyst_pain', 'thyroid_symptoms', 'pcos_symptoms',
  'perimenopause_symptoms', 'hormonal_imbalance', 'severe_mood_dips', 'grief_sadness', 'birth_control_side_effects',
]);

export interface ConditionMatch { condition: string; label: string; similarity: number }

export function conditionEmbeddingText(label: string, description?: string | null): string {
  const d = (description ?? '').trim().slice(0, 300);
  return d ? `${label}. ${d}` : label;
}

/** Best allowed match that clears the bar and is clearly ahead of the runner-up. Pure. */
export function pickCondition(
  matches: ConditionMatch[],
  opts: { min?: number; margin?: number; exclude?: Set<string> } = {},
): string | null {
  const min = opts.min ?? conditionMin();
  const margin = opts.margin ?? conditionMargin();
  const exclude = opts.exclude ?? SEMANTIC_EXCLUDE;
  const sorted = [...matches].sort((a, b) => b.similarity - a.similarity);
  const top = sorted[0];
  if (!top || top.similarity < min) return null;
  // If the very best is a serious condition, do not quietly fall to a lesser one.
  if (exclude.has(top.condition)) return null;
  const second = sorted[1];
  if (second && top.similarity - second.similarity < margin && !exclude.has(second.condition)) return null;
  return top.condition;
}

/** Top matches by meaning (for the matcher and for calibration). Empty on any failure. */
export async function matchConditionsByMeaning(text: string, limit = 5): Promise<ConditionMatch[]> {
  const v = await embedText(text, 'RETRIEVAL_QUERY', { timeoutMs: 3000 });
  if (!v) return [];
  const { data, error } = await supabaseAdmin.rpc('match_condition', { p_embedding: toPgVector(v), p_limit: limit });
  if (error) { console.error('match_condition failed:', error.message); return []; }
  return (data ?? []) as ConditionMatch[];
}

/** Embeds conditions that have no vector yet (one per distinct remedies.condition). */
export async function embedMissingConditions(limit = 60): Promise<{ embedded: number; failed: number; remaining: number }> {
  const { data: rems } = await supabaseAdmin.from('remedies').select('condition,condition_label,description').eq('active', true);
  const byCond = new Map<string, { label: string; description: string | null }>();
  for (const r of rems ?? []) if (r.condition && !byCond.has(r.condition)) byCond.set(r.condition, { label: r.condition_label || r.condition, description: r.description });
  const { data: have } = await supabaseAdmin.from('condition_embeddings').select('condition');
  const done = new Set((have ?? []).map((h: any) => h.condition));
  const todo = Array.from(byCond.entries()).filter(([c]) => !done.has(c));
  let embedded = 0, failed = 0;
  for (const [condition, { label, description }] of todo.slice(0, limit)) {
    const v = await embedText(conditionEmbeddingText(label, description), 'RETRIEVAL_DOCUMENT', { timeoutMs: 5000 });
    if (!v) { failed++; continue; }
    const { error } = await supabaseAdmin.from('condition_embeddings')
      .upsert({ condition, label, embedding: toPgVector(v), updated_at: new Date().toISOString() }, { onConflict: 'condition' });
    if (error) failed++; else embedded++;
  }
  return { embedded, failed, remaining: Math.max(0, todo.length - embedded) };
}

/** Word matcher first; meaning matcher only when it finds nothing. */
export async function detectConditionSmart(text: string): Promise<string | null> {
  const { detectCondition, isNegatedOrResolved } = await import('./remedies');
  const byWord = detectCondition(text);
  if (byWord) return byWord;
  const t = text.trim();
  if (t.length < 6 || t.length > 200) return null;
  if (isNegatedOrResolved(t.toLowerCase())) return null;
  try { return pickCondition(await matchConditionsByMeaning(t)); } catch { return null; }
}
