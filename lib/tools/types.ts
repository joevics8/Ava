import type { Lang } from '@/lib/site';

export type ToolId = string;

export interface ToolText {
  slug: string;          // ASCII, translated per language
  title: string;         // <title>, ≤ 60 chars including " | Ava"
  h1: string;
  description: string;   // meta description, ≤ 155 chars
  intro: string;
  faqs: { q: string; a: string }[];
  /** Short line shown above the Telegram button after the result. */
  cta: string;
  /**
   * The crawlable "about this tool" section, in Markdown (## headings; the page
   * title is the only h1). It is rendered on the server into the page HTML, so
   * search engines read it without running any JavaScript. Aim for 350-700 words
   * of original, accurate, plain-language content that answers what people search.
   */
  article?: string;
}

export type ToolCategory = 'cycle' | 'pregnancy' | 'baby' | 'sexual-health' | 'contraception' | 'labs';

export interface Tool {
  id: ToolId;
  category?: ToolCategory;
  related: ToolId[];
  text: Partial<Record<Lang, ToolText>>;
}
