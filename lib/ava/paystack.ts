import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET = process.env.PAYSTACK_SECRET_KEY!;

// ─── Create payment link ──────────────────────────────────────────────────────

export async function createPaymentLink(
  telegramId: number,
  name: string
): Promise<{ url: string; reference: string } | null> {
  const email = `${telegramId}@ava.user`; // placeholder — Paystack requires email
  const reference = `ava_${telegramId}_${Date.now()}`;

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: 200000, // ₦2,000 in kobo
      reference,
      currency: 'NGN',
      plan: process.env.PAYSTACK_PLAN_CODE || undefined, // optional recurring plan
      metadata: {
        telegram_id: telegramId,
        name,
        custom_fields: [
          { display_name: 'Name', variable_name: 'name', value: name },
          { display_name: 'Telegram ID', variable_name: 'telegram_id', value: String(telegramId) },
        ],
      },
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/premium/success`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    console.error('Paystack init error:', data);
    return null;
  }

  return { url: data.data.authorization_url, reference };
}

// ─── Verify Paystack webhook signature ───────────────────────────────────────

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

// ─── Verify a transaction directly (double-check after webhook) ───────────────

export async function verifyTransaction(reference: string): Promise<boolean> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  const data = await res.json();
  return data?.data?.status === 'success';
}
