import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ava — Your AI Cycle & Wellness Companion',
  description: 'Ava learns your unique cycle, remembers your patterns, and talks to you like a friend who actually gets it.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="text-6xl">🌸</div>
        <h1 className="text-4xl font-bold text-[#C2185B] leading-tight">
          Meet Ava
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Your AI-powered cycle and wellness companion. Ava learns your unique body,
          remembers your patterns, and talks to you like a friend who actually gets it.
        </p>

        <a
          href="https://t.me/Ava_care_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#E91E63] text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-[#C2185B] transition-colors shadow-lg"
        >
          <span>💬</span> Start on Telegram — Free
        </a>

        <p className="text-sm text-gray-400">No app download needed · Works on any phone</p>
      </div>

      {/* Features */}
      <div className="max-w-2xl w-full mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { emoji: '🧠', title: 'She Remembers', desc: 'Ava tracks every symptom, mood, and cycle event — and brings it up when it matters.' },
          { emoji: '💬', title: 'Talks Like a Friend', desc: 'No clinical jargon. Just warm, honest insights about what\'s happening in your body.' },
          { emoji: '🔒', title: 'Private & Secure', desc: 'Your data is yours. Nothing is sold or shared.' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-3">
            <div className="text-3xl">{f.emoji}</div>
            <h3 className="font-semibold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="max-w-2xl w-full mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-gray-100 space-y-4">
          <div className="text-2xl font-bold text-gray-800">Free</div>
          <div className="text-3xl font-bold text-[#E91E63]">₦0</div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Full onboarding & cycle tracking</li>
            <li>✓ AI chat — ask Ava anything</li>
            <li>✓ Symptom & mood logging</li>
            <li>✓ 2 weeks of memory</li>
          </ul>
          <a href="https://t.me/Ava_care_bot" target="_blank"
            className="block text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            Start Free
          </a>
        </div>

        <div className="bg-[#FCE4EC] rounded-2xl p-8 shadow-sm border-2 border-[#E91E63] space-y-4 relative">
          <div className="absolute -top-3 right-4 bg-[#E91E63] text-white text-xs px-3 py-1 rounded-full font-semibold">
            BEST VALUE
          </div>
          <div className="text-2xl font-bold text-gray-800">Premium</div>
          <div className="text-3xl font-bold text-[#E91E63]">₦2,000<span className="text-base font-normal text-gray-500">/mo</span></div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Everything in Free</li>
            <li>✓ 5 months of memory</li>
            <li>✓ Morning daily digest</li>
            <li>✓ Ovulation test strip reading</li>
            <li>✓ Monthly cycle PDF report</li>
          </ul>
          <a href="https://t.me/Ava_care_bot" target="_blank"
            className="block text-center bg-[#E91E63] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#C2185B] transition-colors">
            Get Premium
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-sm text-gray-400 flex gap-6">
        <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
        <Link href="/terms" className="hover:text-gray-600">Terms</Link>
      </footer>
    </main>
  );
}
