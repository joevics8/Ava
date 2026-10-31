import { Bricolage_Grotesque, Literata } from 'next/font/google';

// Two families with distinct jobs:
//  - Bricolage Grotesque: headlines and all interface text. It has an optical-size
//    axis, so big headlines get tighter, more characterful shapes automatically.
//  - Literata: long-form reading only (blog articles, legal pages). Designed for
//    sustained reading on phone screens. Not preloaded, so pages that don't use
//    it never pay for it.
export const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],
  display: 'swap',
});

export const reading = Literata({
  subsets: ['latin'],
  variable: '--font-reading',
  display: 'swap',
  preload: false,
});
