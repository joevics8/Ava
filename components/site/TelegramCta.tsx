import { BOT_URL } from '@/lib/site';

// Every call-to-action on the content site points here: Telegram is the
// product, the website is the front door.
export function TelegramCta({ line, button }: { line: string; button: string }) {
  return (
    <aside className="my-8 rounded-2xl border border-pink-200 bg-[#FFF5F7] p-6 text-center">
      <p className="mb-4 text-gray-700">{line}</p>
      <a
        href={BOT_URL}
        rel="noopener"
        className="inline-block rounded-2xl bg-[#E91E63] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#C2185B]"
      >
        {button}
      </a>
    </aside>
  );
}
