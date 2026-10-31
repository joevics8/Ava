import Link from 'next/link';
import { Lang, toolPath } from '@/lib/site';
import { ToolId, toolById } from '@/lib/tools/registry';
import { ui } from '@/lib/ui-strings';

export function RelatedTools({ lang, ids }: { lang: Lang; ids: ToolId[] }) {
  const items = ids.flatMap(id => { const x = toolById(id).text[lang]; return x ? [x] : []; });
  if (!items.length) return null;
  return (
    <section className="my-12">
      <h2 className="mb-4 font-display text-xl font-bold tracking-tight">{ui(lang).relatedTools}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(x => (
          <li key={x.slug}>
            <Link href={toolPath(lang, x.slug)} prefetch={false} className="block rounded-xl border border-line bg-white p-4 transition-colors hover:border-primary hover:text-primary">
              <span className="font-display font-semibold">{x.h1}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
