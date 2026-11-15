import Link from 'next/link';

export default function AdminHome() {
  const cards = [
    { href: '/admin/blog', title: 'Blog', body: 'Paste a raw article and clean it with the parser, rewrite it for your keywords, or write a first draft from a brief. Drafts stay on hold until you approve them.' },
    { href: '/admin/tools', title: 'Tools', body: 'Rewrite and expand the page copy and FAQs for each calculator. Edits override the copy in code, and one click reverts them.' },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Content admin</h1>
      <p className="mt-2 max-w-2xl text-muted-ink">AI helps you write and clean text. It never saves or publishes anything by itself: you review every result and press save.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map(c => (
          <Link key={c.href} href={c.href} prefetch={false} className="rounded-2xl border border-line bg-white p-6 transition-colors hover:border-primary">
            <h2 className="font-display text-xl font-bold">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-ink">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
