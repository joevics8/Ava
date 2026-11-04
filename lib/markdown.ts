import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';

// Blog posts are stored as markdown in blog_posts.content. These helpers keep
// the rendered page and the table of contents in agreement: both run the same
// id-assignment over the same parsed tree, so every TOC link has a target.

export interface Heading { depth: 2 | 3; text: string; id: string }

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')      // strip accents: "ovulación" → "ovulacion"
    .replace(/[^\p{L}\p{N}\s-]/gu, '')     // keep letters/numbers in any script
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

/**
 * Remark plugin: gives every heading a unique id (duplicates get -2, -3, ...).
 * `# H1` inside a post is demoted to depth 2, because the page template already
 * renders the post title as the one and only <h1>. Collects the h2/h3 list into
 * `out` so the caller can build a table of contents.
 */
export function headingIds(out?: Heading[]) {
  return () => (tree: any) => {
    const seen = new Map<string, number>();
    visit(tree, 'heading', (node: any) => {
      const text = toString(node).trim();
      const base = slugify(text);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const id = n === 1 ? base : `${base}-${n}`;
      node.data = { ...(node.data ?? {}), hProperties: { ...(node.data?.hProperties ?? {}), id } };
      const depth = Math.max(2, Math.min(3, node.depth)) as 2 | 3;
      if (node.depth <= 3 && text) out?.push({ depth, text, id });
    });
  };
}

/** Headings (h2/h3) of a markdown document, in order, with the ids the renderer will use. */
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  const processor = unified().use(remarkParse).use(remarkGfm).use(headingIds(out));
  processor.runSync(processor.parse(markdown));
  return out;
}

/** Plain text of a markdown document (for word counts and schema). */
export function markdownToText(markdown: string): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const parts: string[] = [];
  visit(tree, (node: any) => {
    if (node.type === 'text' || node.type === 'inlineCode') parts.push(node.value);
    else if (node.type === 'break' || node.type === 'paragraph' || node.type === 'heading' || node.type === 'listItem') parts.push(' ');
  });
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function wordCount(markdown: string): number {
  const text = markdownToText(markdown);
  return text ? text.split(/\s+/).length : 0;
}

/** Whole minutes at ~220 words per minute, never less than 1. */
export const readMinutes = (markdown: string) => Math.max(1, Math.round(wordCount(markdown) / 220));
