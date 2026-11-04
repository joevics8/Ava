'use client';

import { useEffect, useState } from 'react';
import { BOT_URL } from '@/lib/site';

// Every "open Ava on Telegram" button on the site goes through here.
//
// Referral links look like avacare.app/?ref=CODE. The code has to survive the
// click into Telegram (the only place an account is created) as the deep-link
// payload: t.me/Ava_care_bot?start=CODE. Doing that in the browser, instead of
// reading ?ref= on the server, lets every page be static and cacheable: the
// server-rendered HTML always carries the plain bot URL, and the code is added
// after load. The code is also remembered for the tab, so a visitor who lands on
// the home page and then browses to a tool still carries it into Telegram.

const KEY = 'ava_ref';

function readRef(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref')?.trim();
    if (fromUrl && /^[\w-]{1,64}$/.test(fromUrl)) {
      try { sessionStorage.setItem(KEY, fromUrl); } catch { /* storage blocked */ }
      return fromUrl;
    }
    return sessionStorage.getItem(KEY);
  } catch { return null; }
}

export function telegramHref(ref: string | null) {
  return ref ? `${BOT_URL}?start=${encodeURIComponent(ref)}` : BOT_URL;
}

export function TelegramLink({ className, children, target }: { className?: string; children: React.ReactNode; target?: '_blank' }) {
  const [href, setHref] = useState(BOT_URL);
  useEffect(() => { setHref(telegramHref(readRef())); }, []);
  return (
    <a href={href} className={className} rel={target ? 'noopener noreferrer' : 'noopener'} target={target}>
      {children}
    </a>
  );
}
