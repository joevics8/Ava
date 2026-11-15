import { describe, it, expect } from 'vitest';
import { mergeToolText, parseFaqs, parseReviewer } from '../content';
import { TOOLS } from '../registry';

const base = TOOLS[0].text.en!;

describe('mergeToolText', () => {
  it('returns the code copy when there is no override', () => {
    expect(mergeToolText(base, null)).toBe(base);
  });
  it('overrides only the fields that are set and keeps the slug from code', () => {
    const out = mergeToolText(base, { title: 'New title', description: '  ', article: '## Hi\n\nBody', faqs: null });
    expect(out.title).toBe('New title');
    expect(out.description).toBe(base.description);   // blank override falls back
    expect(out.article).toBe('## Hi\n\nBody');
    expect(out.faqs).toBe(base.faqs);
    expect(out.slug).toBe(base.slug);
  });
  it('uses override FAQs only when they are valid', () => {
    expect(mergeToolText(base, { faqs: [{ q: 'Q', a: 'A' }] }).faqs).toEqual([{ q: 'Q', a: 'A' }]);
    expect(mergeToolText(base, { faqs: [{ q: '', a: 'A' }, 'junk'] as any }).faqs).toBe(base.faqs);
  });
});

describe('parseFaqs / parseReviewer', () => {
  it('drops incomplete FAQs', () => {
    expect(parseFaqs([{ q: 'a', a: 'b' }, { q: 'x' }, null])).toEqual([{ q: 'a', a: 'b' }]);
    expect(parseFaqs('nope')).toBeUndefined();
  });
  it('only accepts a reviewer with name, credentials and date', () => {
    expect(parseReviewer({ name: 'A B', credentials: 'MBBS', date: '2026-11-15' })).toEqual({ name: 'A B', credentials: 'MBBS', date: '2026-11-15' });
    expect(parseReviewer({ name: 'A B', credentials: 'MBBS' })).toBeUndefined();
    expect(parseReviewer({ name: 'A B', credentials: 'MBBS', date: '2026-11-15', url: 'https://x.org' })?.url).toBe('https://x.org');
    expect(parseReviewer(null)).toBeUndefined();
  });
});
