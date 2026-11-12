import { describe, expect, it } from 'vitest';
import { TOOLS, toolById } from '@/lib/tools/registry';
import { NEW_TOOLS } from '@/lib/tools/defs';
import { TOOL_UI_IDS } from '@/components/tools/ids';

// Guard rails for the tools added after the first three: every one has the
// crawlable article, resolvable related links and a UI registered for it.
describe('health tools', () => {
  it.each(NEW_TOOLS.map(t => [t.id, t] as const))('%s: has an article, valid related ids and a UI', (_id, tool) => {
    for (const [lang, text] of Object.entries(tool.text)) {
      const words = (text!.article ?? '').split(/\s+/).filter(Boolean).length;
      expect(words, `${tool.id}/${lang} article words`).toBeGreaterThanOrEqual(300);
      expect(words, `${tool.id}/${lang} article words`).toBeLessThanOrEqual(900);
      expect(text!.article).toMatch(/^## /m);
      expect(text!.article).not.toMatch(/^# /m);   // the page title is the only h1
      expect(text!.title.length + ' | Ava'.length).toBeLessThanOrEqual(60);
    }
    for (const r of tool.related) expect(toolById(r), `${tool.id} related ${r}`).toBeTruthy();
    expect(TOOL_UI_IDS).toContain(tool.id);
  });
  it('ids are unique', () => {
    const ids = TOOLS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
