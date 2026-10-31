import { Send } from 'lucide-react';
import { BOT_URL } from '@/lib/site';

// Every call-to-action on the content site points here: Telegram is the
// product, the website is the front door.
export function TelegramCta({ line, button, href = BOT_URL }: { line: string; button: string; href?: string }) {
  return (
    <aside className="on-deep my-10 flex flex-col items-start gap-5 rounded-2xl bg-deep p-6 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <p className="max-w-md font-display text-xl font-semibold leading-snug sm:text-2xl">{line}</p>
      <a
        href={href}
        rel="noopener"
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-marigold px-6 font-semibold text-ink transition-colors hover:bg-[hsl(39_92%_52%)]"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {button}
      </a>
    </aside>
  );
}
