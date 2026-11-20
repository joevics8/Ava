import { describe, it, expect } from 'vitest';
import { checkDraft, titleKey, wordCount, type CheckInput } from '../blog-checks';

let k = 0;
const body = (n: number) => Array.from({ length: n }, () => `Entry ${++k} of the guide explains a different detail about week ${k} of the cycle and what people often notice then.`).join(' ');
const good = (over: Partial<CheckInput> = {}): CheckInput => ({
  slug: 'how-to-track-your-cycle', language: 'en', title: 'How to Track Your Cycle Step by Step',
  excerpt: 'A simple way to start.', meta_description: 'Learn how to track your menstrual cycle with a calendar, a few symptoms and a simple routine that shows what is normal for you.',
  content: `Intro text.\n\n## Why track\n${body(45)}\n\n## How to start\n${body(45)}\n\n## When to see a doctor\n${body(30)}`,
  faqs: [1, 2, 3].map(i => ({ q: `Question number ${i} about tracking?`, a: `A complete answer number ${i} with enough words.` })), ...over,
});

describe('checkDraft', () => {
  it('passes a complete draft', () => expect(checkDraft(good())).toEqual({ ok: true, reasons: [] }));
  it('fails short, headingless drafts', () => {
    const r = checkDraft(good({ content: 'Too short.' }));
    expect(r.ok).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/words/);
    expect(r.reasons.join(' ')).toMatch(/headings/);
  });
  it('fails missing meta, excerpt and FAQs', () => {
    const r = checkDraft(good({ meta_description: null, excerpt: '', faqs: [] }));
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
  });
  it('flags placeholders and AI chatter', () => {
    expect(checkDraft(good({ content: good().content + ' [insert source here]' })).ok).toBe(false);
    expect(checkDraft(good({ content: good().content + ' As an AI language model I cannot' })).ok).toBe(false);
  });
  it('flags risky health claims', () => {
    expect(checkDraft(good({ content: good().content + ' This tea cures period pain.' })).ok).toBe(false);
    expect(checkDraft(good({ content: good().content + ' You should stop taking your medication.' })).ok).toBe(false);
    expect(checkDraft(good({ content: good().content + ' The cure rate is not the point here.' })).ok).toBe(true);
  });
  it('flags a leading # title and looped sentences', () => {
    expect(checkDraft(good({ content: '# Title\n' + good().content })).ok).toBe(false);
    const loop = 'This sentence is long enough to count as a repeated sentence in the body. ';
    expect(checkDraft(good({ content: good().content + ' ' + loop.repeat(3) })).reasons.join(' ')).toMatch(/repeated/);
  });
  it('flags duplicate titles', () => {
    expect(checkDraft(good(), { otherTitles: new Set([titleKey('A completely different title')]) }).ok).toBe(true);
    expect(checkDraft(good(), { otherTitles: new Set([titleKey('how to track your cycle step by step')]) }).ok).toBe(false);
  });
});
describe('wordCount', () => { it('ignores markdown marks', () => expect(wordCount('## A heading\n- one two')).toBe(4)); });
