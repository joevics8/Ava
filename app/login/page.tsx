import { Metadata } from 'next';
import { Send } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import { BottomNav } from '@/components/site/BottomNav';
import { navItems } from '@/components/site/nav-items';

export const metadata: Metadata = { title: 'Log in — Ava' };

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'Ava_care_bot';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://avacare-alpha.vercel.app';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    invalid: 'Login failed. Please try again.',
    expired: 'Your login link expired. Please try again.',
    notfound: 'No Ava account found. Start the bot first, then come back here.',
  };

  return (
    <div className="min-h-screen bg-paper pb-[3.75rem] text-ink md:pb-0">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Logo className="text-primary" />
      </header>

      <main className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">Your Ava dashboard</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-ink">
          See what Ava knows about your cycle. The dashboard connects to your Telegram chat with her.
        </p>

        <ol className="mt-10 space-y-8">
          <li>
            <h2 className="font-display text-xl font-semibold">1. Start Ava on Telegram</h2>
            <p className="mt-1 text-muted-ink">Skip this if you have already chatted with Ava.</p>
            <a href={`https://t.me/${BOT_NAME}`} rel="noopener"
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-marigold px-6 font-semibold text-ink transition-colors hover:bg-[hsl(39_92%_52%)]">
              <Send className="h-4 w-4" aria-hidden="true" />
              Open Ava on Telegram
            </a>
          </li>
          <li>
            <h2 className="font-display text-xl font-semibold">2. Sign in with the same Telegram account</h2>

            {searchParams.error && (
              <p role="alert" className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 font-medium text-destructive">
                {errorMessages[searchParams.error] || 'Something went wrong. Please try again.'}
              </p>
            )}

            {/* Telegram Login Widget */}
            <div
              className="mt-4"
              dangerouslySetInnerHTML={{
                __html: `<script
                async
                src="https://telegram.org/js/telegram-widget.js?22"
                data-telegram-login="${BOT_NAME}"
                data-size="large"
                data-auth-url="${SITE_URL}/api/auth/telegram"
                data-request-access="write"
              ></script>`,
              }}
            />
          </li>
        </ol>

        <p className="mt-10 text-sm leading-relaxed text-muted-ink">
          We only use your Telegram ID to identify your account. We never post anything on your behalf.
        </p>
      </main>
      <BottomNav items={navItems('en')} label="Main navigation" />
    </div>
  );
}
