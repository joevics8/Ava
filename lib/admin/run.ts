import { TOOLS } from '@/lib/tools/registry';
import { ContentResult, Finished, JobInput, RESULT_SCHEMA, buildPrompt, countWords, finish, parseResult } from './content-ai';
import { callGeminiJson, withGeminiFallback } from './gemini';

/** Tools the AI may link to from blog posts. */
export const TOOL_CHOICES = TOOLS.map(t => ({ id: t.id, title: t.text.en?.h1 ?? t.id }));

/**
 * Runs one parse / rewrite / write job. If the draft comes back well under the
 * word target, the next model/key is tried; if none reach it, the longest draft
 * is returned (with a warning) rather than failing.
 */
export async function runJob(input: JobInput): Promise<Finished & { model: string }> {
  const full: JobInput = { ...input, tools: input.tools ?? TOOL_CHOICES };
  const prompt = buildPrompt(full);
  const min = full.mode !== 'parse' && full.targetWords ? full.targetWords * 0.85 : 0;

  let best: { result: ContentResult; model: string } | null = null;
  try {
    best = await withGeminiFallback('AI job', async (model, key) => {
      const result = parseResult(await callGeminiJson(model, key, prompt, RESULT_SCHEMA));
      const words = countWords(result.body);
      if (!best || words > countWords(best.result.body)) best = { result, model };
      if (words < min) throw new Error(`draft too short (${words} words)`);
      return { result, model };
    });
  } catch (err) {
    if (!best) throw err;
  }
  const done = finish(best!.result, full);
  return { ...done, model: best!.model };
}
