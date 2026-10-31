import Link from 'next/link';
import { LogoMark, RingTone } from './CycleRing';

export function Logo({ href = '/', tone = 'light', className = '' }: { href?: string; tone?: RingTone; className?: string }) {
  return (
    <Link href={href} prefetch={false} aria-label="Ava home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} tone={tone} />
      <span className="font-display text-[1.45rem] font-bold leading-none tracking-tight">Ava</span>
    </Link>
  );
}
