/**
 * ONE place to control the AI writer/parser in /admin. Change the models here
 * and it applies to blog parsing, rewriting and tool copy.
 *
 * Tried in order: the first model, then the next, each across every key.
 * Long-form writing uses the stronger model first.
 */
export const ADMIN_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite'] as const;

/** Output budget. Thinking tokens come out of the same budget, so keep it generous. */
export const ADMIN_MAX_OUTPUT_TOKENS = 20000;

/** Every Gemini key in env: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_1, ... (rotated to spread quota). */
export function geminiKeys(env: Record<string, string | undefined> = process.env): string[] {
  const keys = Object.entries(env)
    .filter(([name, v]) => /^GEMINI_API/i.test(name) && typeof v === 'string' && v.trim())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => (v as string).trim());
  const unique = Array.from(new Set(keys));
  if (!unique.length) throw new Error('No Gemini API key set. Add GEMINI_API_KEY in the environment.');
  return unique;
}

let rotation = 0;

/** Runs fn over every model and key (rotating the starting key); returns the first success, else throws the last error. */
export async function withGeminiFallback<T>(label: string, fn: (model: string, apiKey: string) => Promise<T>): Promise<T> {
  const keys = geminiKeys();
  const start = rotation++ % keys.length;
  const ordered = keys.map((_, i) => keys[(start + i) % keys.length]);
  let lastErr: unknown;
  for (const model of ADMIN_MODELS) {
    for (const key of ordered) {
      try { return await fn(model, key); } catch (err) { lastErr = err; }
    }
  }
  throw new Error(`${label} failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

export interface GeminiJsonOptions { maxOutputTokens?: number; temperature?: number }

/** One structured-JSON call. The key travels in a header, never in a URL that could be logged. */
export async function callGeminiJson(model: string, apiKey: string, prompt: string, schema: object, opts: GeminiJsonOptions = {}): Promise<unknown> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        maxOutputTokens: opts.maxOutputTokens ?? ADMIN_MAX_OUTPUT_TOKENS,
        temperature: opts.temperature ?? 0.4,
        // Gemini 3 models think by default and that eats the output budget; keep it low for editing/writing.
        thinkingConfig: { thinkingLevel: 'low' },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const cand = json?.candidates?.[0];
  const text = (cand?.content?.parts ?? []).filter((p: any) => p?.text && !p?.thought).map((p: any) => p.text).join('');
  if (!text) throw new Error(`Gemini ${model}: empty response (${cand?.finishReason ?? 'no candidate'})`);
  if (cand?.finishReason === 'MAX_TOKENS') throw new Error(`Gemini ${model}: output cut off (MAX_TOKENS)`);
  return JSON.parse(text);
}
