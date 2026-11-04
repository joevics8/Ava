import { ToolPage, toolMetadata } from '@/components/site/views';
import { TOOLS } from '@/lib/tools/registry';
export const revalidate = 86400;
export function generateStaticParams() { return TOOLS.flatMap(t => (t.text.en ? [{ slug: t.text.en.slug }] : [])); }
export function generateMetadata({ params }: { params: { slug: string } }) { return toolMetadata('en', params.slug); }
export default function Page({ params }: { params: { slug: string } }) { return <ToolPage lang="en" slug={params.slug} />; }
