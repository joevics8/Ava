import '../../globals.css';
import { rootMetadata } from '@/lib/root-metadata';
import { RootDocument } from '@/components/site/RootDocument';
import { isEnabledLang } from '@/lib/site';

export const metadata = rootMetadata;

export default function LangLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  // An unknown prefix (e.g. /foo) renders the 404 page; give it a valid lang rather than echoing the URL.
  return <RootDocument lang={isEnabledLang(params.lang) ? params.lang : 'en'}>{children}</RootDocument>;
}
