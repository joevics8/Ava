import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Login — Ava' };

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'AvaByVerm_bot';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://avacare-alpha.vercel.app';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    invalid: 'Login failed — please try again.',
    expired: 'Login link expired — please try again.',
    notfound: 'No Ava account found. Start the bot first, then come back here.',
  };

  return (
    <main className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center px-4 text-center space-y-8">
      <div className="text-5xl">🌸</div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#E91E63]">Welcome back</h1>
        <p className="text-gray-500">Sign in with your Telegram account to access your dashboard.</p>
      </div>

      {searchParams.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl text-sm">
          {errorMessages[searchParams.error] || 'Something went wrong.'}
        </div>
      )}

      {/* Telegram Login Widget */}
      <div
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

      <p className="text-xs text-gray-400 max-w-xs">
        We only use your Telegram ID to identify your account. We never post anything on your behalf.
      </p>
    </main>
  );
}
