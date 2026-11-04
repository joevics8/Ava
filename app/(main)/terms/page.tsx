import { Metadata } from 'next';
import { Breadcrumbs, JsonLd, PageShell } from '@/components/site/PageShell';
import { breadcrumbLd, graphLd, pageMetadata, webPageLd } from '@/lib/seo';

const TITLE = 'Terms of Service';
const DESCRIPTION = 'The terms for using Ava: wellness information only (not medical advice), your Telegram account, Premium billing and acceptable use.';

export const revalidate = 86400;
export const metadata: Metadata = pageMetadata({ lang: 'en', path: '/terms', title: TITLE, description: DESCRIPTION });

export default function TermsPage() {
  const ld = graphLd([
    webPageLd('/terms', TITLE, DESCRIPTION, 'en'),
    breadcrumbLd([{ name: 'Home', path: '/' }, { name: TITLE, path: '/terms' }]),
  ]);
  return (
    <PageShell lang="en">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: TITLE }]} />
      <article className="prose-ava">
        <h1 className="font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p>Last updated: August 2026</p>
        <p>By using Ava, you agree to the following terms.</p>
        <h2>Not medical advice</h2>
        <p>Ava provides wellness information and cycle tracking only. She is not a doctor and does not provide medical diagnoses or prescriptions. Always consult a qualified healthcare provider for medical concerns.</p>
        <h2>Your account</h2>
        <p>Your Telegram account is your identity on Ava. You are responsible for keeping your account secure.</p>
        <h2>Premium subscription</h2>
        <p>Premium subscriptions are billed monthly at ₦2,000. Cancellations take effect at the end of the billing period.</p>
        <h2>Acceptable use</h2>
        <p>Do not attempt to misuse or abuse Ava&rsquo;s systems. We reserve the right to suspend accounts that violate these terms.</p>
      </article>
    </PageShell>
  );
}
