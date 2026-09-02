import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payment Successful — Ava' };

export default function PremiumSuccessPage() {
  return (
    <main className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="text-6xl">🌸</div>
      <h1 className="text-3xl font-bold text-[#E91E63]">You're Premium!</h1>
      <p className="text-gray-600 max-w-sm">
        Your payment was successful. Head back to Telegram — Ava has already sent you a confirmation with everything that's unlocked.
      </p>
      <a
        href="https://t.me/Ava_care_bot"
        className="bg-[#E91E63] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#C2185B] transition-colors"
      >
        Back to Ava
      </a>
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Home</Link>
    </main>
  );
}
