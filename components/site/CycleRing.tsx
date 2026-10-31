import { PHASE_LABEL, PhaseKey, cyclePhases, phaseOfDay } from '@/lib/cycle-ring';

// The cycle ring is Ava's signature graphic: one circle, four phases. It is the
// hero visual, the logo mark and the centrepiece of the dashboard. Pure SVG, no
// client JS. The draw-in animation lives in globals.css (.ring-arc) and stops
// for people who prefer reduced motion.

const R = 100;
const C = 2 * Math.PI * R;

const COLORS = {
  light: {
    period: 'hsl(var(--phase-period))',
    follicular: 'hsl(var(--phase-follicular))',
    ovulation: 'hsl(var(--phase-ovulation))',
    luteal: 'hsl(var(--phase-luteal))',
    text: 'hsl(var(--ink))',
    muted: 'hsl(var(--muted-ink))',
    marker: 'hsl(var(--paper))',
  },
  deep: {
    period: 'hsl(var(--phase-period-on-deep))',
    follicular: 'hsl(var(--phase-follicular-on-deep))',
    ovulation: 'hsl(var(--phase-ovulation))',
    luteal: 'hsl(var(--phase-luteal))',
    text: 'hsl(var(--paper))',
    muted: 'hsl(var(--paper) / 0.72)',
    marker: 'hsl(var(--paper))',
  },
} as const;

export type RingTone = keyof typeof COLORS;

function Arcs({ cycleLength, periodLength, tone, strokeWidth, gap, animate }: {
  cycleLength: number; periodLength: number; tone: RingTone; strokeWidth: number; gap: number; animate: boolean;
}) {
  const spans = cyclePhases(cycleLength, periodLength);
  const total = spans[spans.length - 1].end;
  return (
    <>
      {spans.map((s, i) => {
        const len = (s.days / total) * C;
        const start = ((s.start - 1) / total) * C;
        return (
          <circle
            key={s.key}
            cx={120} cy={120} r={R} fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(len - gap, 1)} ${C}`}
            strokeDashoffset={-(start + gap / 2)}
            transform="rotate(-90 120 120)"
            className={animate ? 'ring-arc' : undefined}
            style={{ stroke: COLORS[tone][s.key], animationDelay: animate ? `${i * 0.38}s` : undefined }}
          />
        );
      })}
    </>
  );
}

export interface CycleRingProps {
  cycleLength?: number;
  periodLength?: number;
  /** Today's cycle day. Omit (or null) to draw the ring without a marker. */
  day?: number | null;
  tone?: RingTone;
  /** Text inside the ring. */
  top?: string;
  main?: string;
  bottom?: string;
  animate?: boolean;
  className?: string;
  label?: string;
}

export function CycleRing({
  cycleLength = 28, periodLength = 5, day = null, tone = 'deep', top, main, bottom, animate = false, className, label,
}: CycleRingProps) {
  const spans = cyclePhases(cycleLength, periodLength);
  const total = spans[spans.length - 1].end;
  const inCycle = day != null && day >= 1 && day <= total;
  const phase: PhaseKey | null = inCycle ? phaseOfDay(day!, spans) : null;
  const angle = inCycle ? (((day! - 0.5) / total) * 360 - 90) * (Math.PI / 180) : 0;
  const mx = 120 + R * Math.cos(angle);
  const my = 120 + R * Math.sin(angle);
  const c = COLORS[tone];

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={label ?? (inCycle ? `Cycle ring: day ${day} of ${total}, ${PHASE_LABEL[phase!]}` : `Cycle ring: ${total}-day cycle in four phases`)}
      className={className}
    >
      <Arcs cycleLength={cycleLength} periodLength={periodLength} tone={tone} strokeWidth={20} gap={5} animate={animate} />
      {inCycle && (
        <g className={animate ? 'ring-marker' : undefined} style={{ transformOrigin: `${mx}px ${my}px` }}>
          <circle cx={mx} cy={my} r={17} style={{ fill: c.marker }} />
          <circle cx={mx} cy={my} r={8} style={{ fill: c[phase!] }} />
        </g>
      )}
      {top && <text x={120} y={86} textAnchor="middle" style={{ fill: c.muted, fontSize: 15, fontWeight: 500 }}>{top}</text>}
      {main && <text x={120} y={138} textAnchor="middle" style={{ fill: c.text, fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em' }}>{main}</text>}
      {bottom && <text x={120} y={166} textAnchor="middle" style={{ fill: c.muted, fontSize: 14, fontWeight: 500 }}>{bottom}</text>}
    </svg>
  );
}

/** The ring, simplified, as the Ava logo mark. */
export function LogoMark({ size = 28, tone = 'light', className }: { size?: number; tone?: RingTone; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} aria-hidden="true" focusable="false" className={className}>
      <Arcs cycleLength={28} periodLength={5} tone={tone} strokeWidth={42} gap={16} animate={false} />
    </svg>
  );
}
