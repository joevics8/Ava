import { geminiKeys } from '@/lib/admin/gemini';

// Meaning-based search for memory. Each entry the user reports is turned into a
// vector once (when it is saved); a message is turned into a vector when she
// brings up a topic; the closest entries are her related history. It finds
// "period pain" for "cramps", "that thing in October", slang, misspellings and
// other languages, which a word match cannot.

export const EMBED_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
export const EMBED_DIMS = 768; // must match memory_log.embedding vector(768)
/** Minimum cosine similarity (0-1) to count as related. Tune with MEMORY_MATCH_MIN if matches are too loose or too strict. */
export const matchMin = () => Number(process.env.MEMORY_MATCH_MIN) || 0.62;

export type EmbedTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

/** What gets embedded for a saved entry: the tag plus her own words, when they add something. */
export function embeddingText(summary: string, detail?: string | null): string {
  const d = (detail ?? '').trim();
  return (d && d.toLowerCase() !== summary.trim().toLowerCase() ? `${summary} | ${d}` : summary).slice(0, 500);
}

export function normalizeVector(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map(x => x / norm) : v;
}

/** PostgREST accepts a pgvector column or argument as the text form "[0.1,0.2,...]". */
export const toPgVector = (v: number[]) => `[${v.map(x => Number(x.toFixed(6))).join(',')}]`;

/** An embedding, or null on any failure (embedding is an extra: saving and chatting must never depend on it). */
export async function embedText(
  text: string, task: EmbedTask, opts: { fetchImpl?: typeof fetch; apiKey?: string; timeoutMs?: number } = {},
): Promise<number[] | null> {
  const clean = text.trim();
  if (!clean) return null;
  const doFetch = opts.fetchImpl ?? fetch;
  let key = opts.apiKey;
  try { key = key ?? geminiKeys()[0]; } catch { return null; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;

  // The API documents settings both at the top level and inside embedContentConfig; try the
  // top-level form first and fall back to the config form if it is rejected.
  const bodies = [
    { content: { parts: [{ text: clean }] }, taskType: task, outputDimensionality: EMBED_DIMS },
    { content: { parts: [{ text: clean }] }, embedContentConfig: { taskType: task, outputDimensionality: EMBED_DIMS } },
  ];
  for (const body of bodies) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 4000);
    try {
      const res = await doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key! }, body: JSON.stringify(body), signal: ctl.signal });
      if (!res.ok) { if (res.status === 400) continue; console.error('embed failed:', res.status); return null; }
      const data = await res.json();
      const values: unknown = data?.embedding?.values ?? data?.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length < EMBED_DIMS) { console.error('embed: unexpected shape', Array.isArray(values) ? values.length : typeof values); return null; }
      return normalizeVector((values as number[]).slice(0, EMBED_DIMS));
    } catch (e) {
      console.error('embed error:', e instanceof Error ? e.message : e);
      return null;
    } finally { clearTimeout(timer); }
  }
  return null;
}
