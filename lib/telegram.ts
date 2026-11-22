// One way to send a Telegram message from anywhere outside the webhook (crons, payments).
// Markdown is tried first; if Telegram rejects it ("can't parse entities", usually a stray * or _
// in a name or an AI sentence) the same text goes again as plain text, so a message is never lost
// to formatting. Long texts are split under Telegram's 4096-character limit.

export const TELEGRAM_MAX = 4000;

export function plainText(text: string): string {
  return text.split('**').join('').split('*').join('').split('_').join('').split('`').join('').trim();
}

export function splitForTelegram(text: string, maxLen = TELEGRAM_MAX): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf('\n\n', maxLen);
    if (cut < maxLen / 2) cut = rest.lastIndexOf('\n', maxLen);
    if (cut < maxLen / 2) cut = rest.lastIndexOf(' ', maxLen);
    if (cut < maxLen / 2) cut = maxLen;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export interface SendResult { ok: boolean; /** The user blocked the bot or deleted the chat. */ blocked: boolean }

export async function sendTelegram(
  chatId: number, text: string,
  opts: { markdown?: boolean; keyboard?: unknown; fetchImpl?: typeof fetch; token?: string } = {},
): Promise<SendResult> {
  const token = opts.token ?? process.env.TELEGRAM_BOT_TOKEN;
  const doFetch = opts.fetchImpl ?? fetch;
  if (!token) return { ok: false, blocked: false };
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const chunks = splitForTelegram(opts.markdown ? text : plainText(text));
  let ok = true, blocked = false;

  const post = async (body: Record<string, unknown>) => {
    try {
      const res = await doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) console.error('Telegram sendMessage failed:', res.status, JSON.stringify(await res.json().catch(() => ({}))).slice(0, 300));
      return res;
    } catch (e) {
      console.error('Telegram sendMessage error:', e instanceof Error ? e.message : e);
      return null;
    }
  };

  for (let i = 0; i < chunks.length; i++) {
    const markup = i === chunks.length - 1 && opts.keyboard ? { reply_markup: { inline_keyboard: opts.keyboard } } : {};
    let res = await post({ chat_id: chatId, text: chunks[i], ...(opts.markdown ? { parse_mode: 'Markdown' } : {}), ...markup });
    if (res && !res.ok && res.status !== 403 && opts.markdown) {
      res = await post({ chat_id: chatId, text: plainText(chunks[i]), ...markup });
    }
    if (!res || !res.ok) { ok = false; if (res?.status === 403) blocked = true; }
  }
  return { ok, blocked };
}
