import { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';

export const metadata: Metadata = { title: 'Terms of Service — Ava' };

export default function TermsPage() {
  return (
    <PageShell lang="en">
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
