import Link from 'next/link';
import { Metadata } from 'next';
import { Send } from 'lucide-react';
import { CycleRing } from '@/components/site/CycleRing';

export const metadata: Metadata = { title: 'Payment successful — Ava' };

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'Ava_care_bot'}`;

export default function PremiumSuccessPage() {
  return (
    <main className="on-deep flex min-h-screen flex-col items-center justify-center bg-deep px-4 py-12 text-center text-paper">
      <CycleRing tone="deep" animate className="h-28 w-28" label="Premium unlocked" />
      <h1 className="mt-8 font-display text-4xl font-bold tracking-tight">You&rsquo;re Premium</h1>
      <p className="mt-4 max-w-sm text-lg leading-relaxed text-paper/85">
        Your payment went through. Head back to Telegram: Ava has sent you a confirmation with everything that&rsquo;s unlocked.
      </p>
      <a href={BOT_URL}
        className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-marigold px-8 text-lg font-semibold text-ink transition-colors hover:bg-[hsl(39_92%_52%)]">
        <Send className="h-5 w-5" aria-hidden="true" />
        Back to Ava
      </a>
      <Link href="/" className="mt-6 py-2 text-paper/80 underline underline-offset-4 hover:text-paper">Go to the home page</Link>
    </main>
  );
}
