import { describe, expect, it } from 'vitest';
import { extractHeadings, markdownToText, readMinutes, slugify, wordCount } from '@/lib/markdown';

describe('slugify', () => {
  it('lowercases, strips punctuation and joins with dashes', () => {
    expect(slugify('What is ovulation?')).toBe('what-is-ovulation');
  });
  it('strips accents so Spanish headings give clean anchors', () => {
    expect(slugify('¿Cuándo es la ovulación?')).toBe('cuando-es-la-ovulacion');
  });
  it('never returns an empty id', () => {
    expect(slugify('???')).toBe('section');
  });
});

describe('extractHeadings', () => {
  const md = `# Title inside body

Intro paragraph.

## Phases of the cycle

### The luteal phase

Some text.

## Phases of the cycle

#### Too deep to list
`;

  it('lists h2/h3 in order and demotes a body h1 to depth 2', () => {
    const h = extractHeadings(md);
    expect(h.map(x => [x.depth, x.text])).toEqual([
      [2, 'Title inside body'],
      [2, 'Phases of the cycle'],
      [3, 'The luteal phase'],
      [2, 'Phases of the cycle'],
    ]);
  });

  it('makes duplicate heading ids unique', () => {
    const ids = extractHeadings(md).map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('phases-of-the-cycle-2');
  });

  it('ignores # lines inside code fences', () => {
    const h = extractHeadings('## Real\n\n```\n## not a heading\n```\n');
    expect(h.map(x => x.text)).toEqual(['Real']);
  });

  it('uses the visible text of headings with inline formatting', () => {
    expect(extractHeadings('## **Bold** and `code`')[0].text).toBe('Bold and code');
  });
});

describe('text helpers', () => {
  it('counts words without markdown syntax', () => {
    expect(wordCount('## Hi there\n\nSome **bold** words and a [link](https://example.com).')).toBe(9);
  });
  it('drops raw urls and syntax from plain text', () => {
    expect(markdownToText('[Ava](https://t.me/Ava_care_bot) is **here**')).toBe('Ava is here');
  });
  it('rounds reading time and never returns 0', () => {
    expect(readMinutes('short')).toBe(1);
    expect(readMinutes(Array(660).fill('word').join(' '))).toBe(3);
  });
});
