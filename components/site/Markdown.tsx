import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingIds } from '@/lib/markdown';
import { SITE } from '@/lib/site';

// Renders blog markdown. Raw HTML in the source is NOT rendered (react-markdown
// escapes it) and javascript:/data: link targets are dropped, so a bad draft
// can't inject script. Styling comes from .prose-ava in globals.css.

const siteHost = (() => { try { return new URL(SITE).host; } catch { return ''; } })();

/** Same-site links get next/link (no prefetch, per CLAUDE.md); everything else opens as a normal external link. */
function Anchor({ href = '', children }: { href?: string; children?: React.ReactNode }) {
  // react-markdown neutralises unsafe targets (javascript:, data:, vbscript:) to "javascript:void(0)" or "".
  // A dead link is worse than none, so keep the words and drop the link.
  if (!href || /^\s*(javascript|data|vbscript):/i.test(href)) return <span>{children}</span>;
  let internal = href.startsWith('/') && !href.startsWith('//');
  let path = href;
  if (!internal && /^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      if (u.host === siteHost) { internal = true; path = `${u.pathname}${u.search}${u.hash}`; }
    } catch { /* leave as external */ }
  }
  if (internal) return <Link href={path} prefetch={false}>{children}</Link>;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return <a href={href}>{children}</a>;
  return <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>;
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-ava">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, headingIds()]}
        components={{
          // The post title is the page's only <h1>; a "# ..." in the body becomes an <h2>.
          h1: ({ node, level, ...props }) => <h2 {...props} />,
          a: ({ node, href, children }) => <Anchor href={href}>{children}</Anchor>,
          img: ({ node, src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src ?? ''} alt={alt ?? ''} loading="lazy" decoding="async" />
          ),
          table: ({ node, ...props }) => <div className="overflow-x-auto"><table {...props} /></div>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
