'use client';

import { useEffect } from 'react';

// Renders nothing until NEXT_PUBLIC_ADSENSE_ID and a slot id are configured,
// so it is safe to place on pages before the AdSense account is approved.
// Never place on /dashboard, /login or anywhere a user types health details.
export function AdUnit({ slot, className }: { slot?: string; className?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_ID;
  useEffect(() => {
    if (!client || !slot) return;
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch { /* ad blocked */ }
  }, [client, slot]);
  if (!client || !slot) return null;
  return (
    <ins className={`adsbygoogle block ${className ?? ''}`} style={{ display: 'block' }}
      data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
  );
}
