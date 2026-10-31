import Link from 'next/link';
import { Lang, toolPath } from '@/lib/site';
import { ToolId, toolById } from '@/lib/tools/registry';
import { ui } from '@/lib/ui-strings';

export function RelatedTools({ lang, ids }: { lang: Lang; ids: ToolId[] }) {
  const items = ids.flatMap(id => { const x = toolById(id).text[lang]; return x ? [x] : []; });
  if (!items.length) return null;
  return (
    <section className="my-10">
      <h2 className="mb-3 text-lg font-semibold">{ui(lang).relatedTools}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(x => (
          <li key={x.slug}>
            <Link href={toolPath(lang, x.slug)} prefetch={false} className="block rounded-xl border border-pink-100 p-4 hover:border-[#E91E63]">
              <span className="font-medium">{x.h1}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
