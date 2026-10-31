'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { Lang } from '@/lib/site';
import { ui } from '@/lib/ui-strings';

// Google Consent Mode v2: everything denied by default, updated on choice.
// The AdSense script only loads when an ID is configured, and this component
// is mounted only in the content-site layout (never chat/dashboard/login).

const KEY = 'ava_consent';
type Choice = 'granted' | 'denied';

function gtagUpdate(choice: Choice) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(['consent', 'update', {
    ad_storage: choice, ad_user_data: choice, ad_personalization: choice, analytics_storage: choice,
  }]);
}

export function ConsentAndAds({ lang }: { lang: Lang }) {
  const t = ui(lang);
  const client = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const [asked, setAsked] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Choice | null;
      if (saved) gtagUpdate(saved); else setAsked(false);
    } catch { setAsked(false); }
  }, []);

  function choose(c: Choice) {
    try { localStorage.setItem(KEY, c); } catch { /* storage blocked */ }
    gtagUpdate(c);
    setAsked(true);
  }

  return (
    <>
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
      `}</Script>
      {client && (
        <Script async strategy="afterInteractive" crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} />
      )}
      {!asked && (
        <div role="dialog" aria-label="Cookies" className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-700">{t.cookieText}</p>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => choose('denied')} className="rounded-lg border border-gray-300 px-4 py-2">{t.decline}</button>
              <button onClick={() => choose('granted')} className="rounded-lg bg-[#E91E63] px-4 py-2 text-white">{t.accept}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
