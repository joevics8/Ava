import { describe, it, expect } from 'vitest';
import {
  buildParsePrompt, buildRewritePrompt, buildWritePrompt, countWords, dropLeadingH1, externalLinks, finish,
  findPlaceholders, fitMeta, parseResult, readTimeMinutes, slugify, stripEditorNoise, type ContentResult, type JobInput,
} from '../content-ai';

const base = (over: Partial<ContentResult> = {}): ContentResult => ({
  title: 'Missed Pill Calculator: What to Do Next', meta_description: 'Missed a pill? See what to do next.', excerpt: 'Short intro.',
  body: '## Why it matters\n\nText here.\n\n## Limits\n\nCheck your leaflet.', faqs: [{ q: 'One?', a: 'Yes.' }, { q: 'Two?', a: 'Yes.' }, { q: 'Three?', a: 'Yes.' }, { q: 'Four?', a: 'Yes.' }],
  slug: 'missed-pill', category: 'contraception', related_tool_ids: [], ...over,
});
const job = (over: Partial<JobInput> = {}): JobInput => ({ mode: 'rewrite', kind: 'tool', language: 'en', tools: [{ id: 'missed-pill-calculator', title: 'Missed Pill Calculator' }], ...over });

describe('countWords', () => {
  it('counts prose only: no heading marks, link targets or code', () => {
    expect(countWords('## Hello\n\nWorld **bold** [link](http://x.com/a/b)\n\n```\nignored code\n```\n- item')).toBe(5);
  });
  it('counts accented and non-latin words', () => {
    expect(countWords('¿Cuándo vuelve la regla? بعد شهر')).toBe(6);
  });
});

describe('slugify / fitMeta / readTime', () => {
  it('makes ascii kebab slugs', () => {
    expect(slugify('Ovulación & Fertilidad: ¿Cuándo?')).toBe('ovulacion-and-fertilidad-cuando');
    expect(slugify('  --Hello   World--  ')).toBe('hello-world');
  });
  it('trims meta on a word boundary with no ellipsis', () => {
    const long = 'word '.repeat(60);
    const out = fitMeta(long);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith(' ')).toBe(false);
    expect(fitMeta('Short and fine.')).toBe('Short and fine.');
  });
  it('rounds read time up, minimum 1', () => {
    expect(readTimeMinutes(0)).toBe(1);
    expect(readTimeMinutes(221)).toBe(2);
  });
});

describe('stripEditorNoise', () => {
  it('removes word counts, preambles, sign-offs and TK lines but keeps the article', () => {
    const md = "Here is the rewritten article:\n\n## Real heading\n\nReal paragraph.\n\n(Word count: 1,240)\n\nTK\n\n**Word count:** 1240\n\nLet me know if you want changes!";
    expect(stripEditorNoise(md)).toBe('## Real heading\n\nReal paragraph.');
  });
  it('does not touch ordinary sentences that start similarly', () => {
    const md = 'Here is why the cycle varies: hormones shift.\n\nWords matter.';
    expect(stripEditorNoise(md)).toBe(md);
  });
});

describe('dropLeadingH1 / links / placeholders', () => {
  it('drops a leading single-# title only', () => {
    expect(dropLeadingH1('# Title\n\n## Sub\n\nx')).toEqual({ text: '## Sub\n\nx', dropped: true });
    expect(dropLeadingH1('## Sub\n\nx').dropped).toBe(false);
  });
  it('lists external links only', () => {
    expect(externalLinks('[a](https://who.int/x) [b](/tools/y) [c](http://nhs.uk)')).toEqual(['https://who.int/x', 'http://nhs.uk']);
  });
  it('finds inline placeholders', () => {
    expect(findPlaceholders('ok\nThis needs [insert stat here] now\nfine')).toHaveLength(1);
  });
});

describe('parseResult', () => {
  it('fills defaults and requires a body', () => {
    expect(parseResult({ body: 'x' }).faqs).toEqual([]);
    expect(() => parseResult({ title: 'x' })).toThrow();
  });
});

describe('finish', () => {
  it('trims over-long meta, filters invented tool ids, cleans the title, and warns', () => {
    const f = finish(base({ meta_description: 'x '.repeat(100), title: '**Bold** `Title`', related_tool_ids: ['missed-pill-calculator', 'made-up-tool'] }), job({ kind: 'blog' }));
    expect(f.result.meta_description.length).toBeLessThanOrEqual(155);
    expect(f.result.title).toBe('Bold Title');
    expect(f.result.related_tool_ids).toEqual(['missed-pill-calculator']);
    expect(f.warnings.join(' ')).toMatch(/trimmed/);
    expect(f.warnings.join(' ')).toMatch(/Check every medical statement/);
  });
  it('warns when the draft misses the word target, and when FAQs or headings are missing', () => {
    const f = finish(base({ body: 'No headings here, just a few words.', faqs: [] }), job({ targetWords: 1200 }));
    const w = f.warnings.join(' | ');
    expect(w).toMatch(/below the 1200-word target/);
    expect(w).toMatch(/Fewer than 4 FAQs/);
    expect(w).toMatch(/no ## headings/);
  });
  it('flags a parse that removed too much text', () => {
    const original = Array(200).fill('word').join(' ');
    const f = finish(base({ body: '## H\n\nonly a few words remain' }), job({ mode: 'parse', body: original }));
    expect(f.warnings.join(' ')).toMatch(/removed \d+% of the words/);
    expect(f.warnings.join(' ')).not.toMatch(/Check every medical statement/);
  });
  it('removes a duplicate leading h1 and editor notes from the body', () => {
    const f = finish(base({ body: '# Same Title\n\n## Real\n\nText.\n\n(Word count: 900)' }), job());
    expect(f.result.body).toBe('## Real\n\nText.');
    expect(f.warnings.join(' ')).toMatch(/leading # title/);
  });
});

describe('prompts', () => {
  it('carry the safety rules and never ask for a reviewer, testimonial or invented source', () => {
    for (const p of [buildRewritePrompt(job({ body: 'src' })), buildWritePrompt(job({ mode: 'write', kind: 'blog', topic: 't' }))]) {
      expect(p).toMatch(/Never invent facts/);
      expect(p).toMatch(/Never say or imply that a doctor/);
      expect(p).toMatch(/Do not write a medical-disclaimer section/);
    }
  });
  it('parse prompt is scissors-only and lists valid tool ids', () => {
    const p = buildParsePrompt(job({ mode: 'parse', kind: 'blog', body: 'x', title: 'T' }));
    expect(p).toMatch(/DO NOT rewrite/);
    expect(p).toMatch(/missed-pill-calculator/);
  });
  it('asks for the word range when a target is set', () => {
    expect(buildRewritePrompt(job({ targetWords: 1200 }))).toMatch(/1140-1320 words/);
  });
});
