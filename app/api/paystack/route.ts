import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/ava/paystack';
import { supabaseAdmin } from '@/lib/supabase';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';

  // Verify it's genuinely from Paystack
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Only handle successful charges
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const { reference, metadata, authorization, amount } = event.data;
  const telegramId = metadata?.telegram_id
    ? Number(metadata.telegram_id)
    : null;

  if (!telegramId) {
    console.error('No telegram_id in metadata');
    return NextResponse.json({ received: true });
  }

  // Idempotency guard — Paystack redelivers webhooks that don't get a fast
  // 2xx response (documented retry behavior). Without this, a redelivered
  // charge.success would re-upgrade the user (resetting premium_expires_at
  // further out than intended), insert a duplicate payment record, and send
  // a second "You're now Premium" message.
  const { data: existingPayment } = await supabaseAdmin
    .from('user_payments')
    .select('id')
    .eq('reference', reference)
    .single();
  if (existingPayment) {
    return NextResponse.json({ received: true });
  }

  // Double-verify with Paystack API
  const valid = await verifyTransaction(reference);
  if (!valid) {
    console.error('Transaction verification failed:', reference);
    return NextResponse.json({ received: true });
  }

  // Set premium expiry to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Update user plan in Supabase
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      plan: 'premium',
      premium_expires_at: expiresAt.toISOString(),
    })
    .eq('telegram_id', telegramId)
    .select()
    .single();

  if (error || !user) {
    console.error('Failed to upgrade user:', error);
    return NextResponse.json({ received: true });
  }

  // Record the payment (with card fingerprint for referral fraud checks)
  // before qualifying any referral, since qualification needs the fingerprint.
  const { recordPayment } = await import('@/lib/ava/db');
  const fingerprint = await recordPayment(user.id, reference, amount, {
    bin: authorization?.bin,
    last4: authorization?.last4,
    bank: authorization?.bank,
    card_type: authorization?.card_type,
    authorization_code: authorization?.authorization_code,
  });

  // Qualify a referral if this user was referred — qualifyReferralIfAny only
  // transitions a 'pending' row, so renewal payments (this webhook fires
  // every month) are a no-op after the first qualification, and referrers
  // are never double-credited for the same person renewing. It also checks
  // the card fingerprint against the referrer's own payments and any other
  // accounts the same referrer has referred, marking the referral 'invalid'
  // instead of 'qualified' when they match — the main realistic self-
  // referral fraud pattern (same card, different "friend" accounts).
  if (user.referred_by) {
    const { qualifyReferralIfAny } = await import('@/lib/ava/db');
    await qualifyReferralIfAny(user.id, fingerprint);
  }

  // Confirm upgrade in Telegram
  await sendMessage(
    telegramId,
    `✨ *You're now Ava Premium, ${user.name}!*\n\n` +
    `Here's what just unlocked:\n` +
    `• 5 months of memory — I'll remember your patterns longer\n` +
    `• Morning digest every day at 8am\n` +
    `• Ovulation test strip reading\n` +
    `• Monthly cycle PDF report with /report\n\n` +
    `Your subscription is active until *${expiresAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}* 🌸`
  );

  return NextResponse.json({ received: true });
}
