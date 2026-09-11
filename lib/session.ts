import crypto from 'crypto';

// The session cookie previously stored raw, unsigned JSON
// ({"telegram_id": ...}) — httpOnly stops *scripts* from reading it, but
// nothing stopped a user from editing their own browser's cookie storage
// (or an attacker who obtained cookie-write access some other way) to swap
// in ANY telegram_id and gain full access to that person's dashboard,
// health data, and account deletion. httpOnly protects against XSS, not
// against a tampered cookie value being trusted at face value.
//
// This signs the payload with HMAC-SHA256 so the server can detect and
// reject any tampering, the same way the Telegram login widget's own hash
// is verified in app/api/auth/telegram/route.ts.

function getSecret(): string {
  // Derived from TELEGRAM_BOT_TOKEN so no new env var is required — the
  // token is already a secret only the server has.
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set — cannot sign sessions');
  return crypto.createHash('sha256').update(token + ':ava-session').digest('hex');
}

export interface SessionPayload {
  telegram_id: number;
  name?: string;
  photo?: string;
}

export function createSessionCookie(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionCookie(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  const [encoded, signature] = cookieValue.split('.');
  if (!encoded || !signature) return null;

  const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  // Constant-time comparison — avoids leaking signature-match info via timing.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}
