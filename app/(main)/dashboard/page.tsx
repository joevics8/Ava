'use client';

import { useEffect, useState } from 'react';
import { latestPeriodStartStr } from '@/lib/ava/period';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { CycleRing } from '@/components/site/CycleRing';
import { BottomNav } from '@/components/site/BottomNav';
import { navItems } from '@/components/site/nav-items';
import { PHASE_LABEL, cycleDayFrom, cyclePhases, phaseOfDay } from '@/lib/cycle-ring';

interface DashboardData { user: any; cycle: any; logs: any[]; }

// Each log category gets a colour dot; the label itself stays in dark ink so it
// is readable. Colours reuse the cycle-phase palette.
const categoryDot: Record<string, string> = {
  symptom: 'bg-phase-period', flow: 'bg-phase-period', mood: 'bg-marigold', cycle: 'bg-phase-luteal',
  sexual: 'bg-phase-luteal', chat: 'bg-primary', bbt: 'bg-phase-follicular', mucus: 'bg-phase-follicular',
  insight: 'bg-muted-ink', test: 'bg-marigold',
};

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'Ava_care_bot';
const BOT_URL = `https://t.me/${BOT_NAME}`;

const card = 'rounded-2xl border border-line bg-white p-5';
const field = 'mt-1 h-11 w-full rounded-xl border border-input bg-white px-3 text-base text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cycleForm, setCycleForm] = useState({ last_period: '', cycle_length: '', period_duration: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'settings'>('overview');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => {
        if (d) {
          setData(d);
          setCycleForm({
            last_period: latestPeriodStartStr(d.cycle) || '',
            cycle_length: String(d.cycle?.avg_cycle_length || 28),
            period_duration: String(d.cycle?.period_duration || 5),
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveCycle() {
    setSaving(true);
    await fetch('/api/account/update-cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleForm),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function deleteAccount() {
    await fetch('/api/account/delete', { method: 'POST' });
    router.push('/');
  }

  const nav = <BottomNav items={navItems('en')} label="Main navigation" />;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-label="Loading your dashboard">
      <CycleRing tone="light" animate className="h-24 w-24" label="Loading" />
    </div>
  );

  if (!data) return null;
  const { user, cycle, logs } = data;
  const isPremium = user.plan === 'premium';
  const expiresAt = user.premium_expires_at
    ? new Date(user.premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = user.referral_code ? `${siteUrl}?ref=${user.referral_code}` : '';

  const cycleLength = Number(cycle?.avg_cycle_length) || 28;
  const periodLength = Number(cycle?.period_duration) || 5;
  const lastPeriod: string | undefined = latestPeriodStartStr(cycle) ?? undefined;
  const rawDay = cycleDayFrom(lastPeriod);
  const spans = cyclePhases(cycleLength, periodLength);
  const day = rawDay != null && rawDay <= cycleLength ? rawDay : null;
  const phase = day != null ? phaseOfDay(day, spans) : null;
  const lateBy = rawDay != null && rawDay > cycleLength ? rawDay - cycleLength : 0;

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the link is still visible in the field */ }
  }

  return (
    <div className="min-h-screen bg-paper pb-[5.5rem] text-ink md:pb-10">
      {/* Header */}
      <header className="on-deep bg-deep text-paper">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-5">
          <div>
            <p className="text-sm text-paper/75">Dashboard</p>
            <h1 className="font-display text-2xl font-bold leading-tight">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isPremium ? 'bg-marigold text-ink' : 'bg-paper/15 text-paper'}`}>
              {isPremium ? 'Premium' : 'Free'}
            </span>
            <a href="/api/auth/logout" className="inline-flex h-9 items-center rounded-full border border-paper/40 px-4 text-sm font-medium hover:border-paper hover:bg-paper/10">Log out</a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div role="tablist" aria-label="Dashboard sections" className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {([['overview', 'Overview'], ['log', 'Health log'], ['settings', 'Settings']] as const).map(([tab, label]) => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
              className={`h-12 flex-1 border-b-[3px] text-[0.95rem] font-semibold transition-colors ${activeTab === tab ? 'border-marigold text-primary' : 'border-transparent text-muted-ink hover:text-primary'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <>
            <section className="on-deep rounded-2xl bg-deep p-5 text-paper sm:p-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Your cycle</h2>
                <button onClick={() => setEditing(!editing)} className="h-9 rounded-full border border-paper/40 px-4 text-sm font-medium hover:border-paper hover:bg-paper/10">
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-paper/90">Last period start
                    <input type="date" value={cycleForm.last_period}
                      onChange={e => setCycleForm(f => ({ ...f, last_period: e.target.value }))}
                      className={`${field} text-ink`} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-medium text-paper/90">Cycle length (days)
                      <input type="number" inputMode="numeric" value={cycleForm.cycle_length}
                        onChange={e => setCycleForm(f => ({ ...f, cycle_length: e.target.value }))}
                        className={`${field} text-ink`} />
                    </label>
                    <label className="block text-sm font-medium text-paper/90">Period length (days)
                      <input type="number" inputMode="numeric" value={cycleForm.period_duration}
                        onChange={e => setCycleForm(f => ({ ...f, period_duration: e.target.value }))}
                        className={`${field} text-ink`} />
                    </label>
                  </div>
                  <button onClick={saveCycle} disabled={saving}
                    className="h-12 w-full rounded-full bg-marigold font-semibold text-ink hover:bg-[hsl(39_92%_52%)] disabled:opacity-60">
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto my-4 w-full max-w-[16rem]">
                    <CycleRing
                      cycleLength={cycleLength} periodLength={periodLength} day={day} tone="deep" animate
                      top={day != null ? 'Cycle day' : lateBy ? 'Past due by' : undefined}
                      main={day != null ? String(day) : lateBy ? `${lateBy}d` : undefined}
                      bottom={phase ? PHASE_LABEL[phase] : lateBy ? 'Log your period in chat' : undefined}
                      className="h-auto w-full"
                    />
                  </div>
                  {day == null && !lateBy && (
                    <p className="pb-2 text-center text-sm text-paper/80">Add the first day of your last period to see where you are in your cycle.</p>
                  )}
                  <dl className="mt-2 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Cycle length', value: cycle?.avg_cycle_length ? `${cycle.avg_cycle_length} days` : '—' },
                      { label: 'Period length', value: cycle?.period_duration ? `${cycle.period_duration} days` : '—' },
                      { label: 'Next period', value: fmt(cycle?.next_period_start) },
                      { label: 'Ovulation', value: fmt(cycle?.next_ovulation_start) },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl bg-paper/10 p-3">
                        <dt className="text-sm text-paper/75">{item.label}</dt>
                        <dd className="font-display text-lg font-semibold">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </section>

            {/* Premium card */}
            {!isPremium ? (
              <section className={`${card} space-y-3 border-marigold`}>
                <h2 className="font-display text-xl font-semibold">Upgrade to Premium: ₦2,000/month</h2>
                <ul className="space-y-1 text-muted-ink">
                  <li>5 months of memory</li>
                  <li>Morning digest at 8am</li>
                  <li>Monthly cycle PDF</li>
                  <li>Ovulation strip reading</li>
                </ul>
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-marigold px-6 font-semibold text-ink hover:bg-[hsl(39_92%_52%)]">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Upgrade on Telegram
                </a>
              </section>
            ) : (
              <section className={`${card} bg-wash`}>
                <h2 className="font-display text-lg font-semibold">Premium is active{expiresAt ? ` until ${expiresAt}` : ''}</h2>
                <button onClick={() => setActiveTab('settings')} className="mt-1 font-medium text-primary underline underline-offset-4">Manage subscription</button>
              </section>
            )}

            {/* Refer & Earn card */}
            {user.referral_code && (
              <section className={`${card} space-y-3`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Refer and earn</h2>
                  <span className="text-sm font-medium text-muted-ink">₦1,000 per friend</span>
                </div>
                <p className="text-muted-ink">Share your link. You earn ₦1,000 for every friend who joins Premium.</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={referralLink} aria-label="Your referral link"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-wash px-3 text-sm text-ink" />
                  <button onClick={copyReferral}
                    className="h-11 shrink-0 rounded-full bg-primary px-5 font-semibold text-paper hover:bg-deep">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Log Tab ── */}
        {activeTab === 'log' && (
          <section className={`${card} space-y-3`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Health log</h2>
              <span className="text-sm text-muted-ink">{isPremium ? 'Last 5 months' : 'Last 14 days'}</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-muted-ink">No entries yet. Chat with Ava on Telegram and your symptoms, moods and notes will appear here.</p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto">
                {logs.map((log: any) => (
                  <li key={log.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-wash px-2.5 py-0.5 text-sm font-medium text-primary">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${categoryDot[log.category] || 'bg-muted-ink'}`} />
                      {log.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink">{log.summary}</p>
                      <p className="text-sm text-muted-ink">
                        {new Date(log.logged_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {isPremium && (
              <section className={`${card} space-y-3`}>
                <h2 className="font-display text-xl font-semibold">Subscription</h2>
                <p className="text-ink">
                  Status: <span className="font-semibold">Premium</span>
                  {expiresAt && <span className="text-muted-ink"> · expires {expiresAt}</span>}
                </p>
                <p className="text-sm text-muted-ink">To cancel, send <span className="rounded bg-wash px-1.5 py-0.5 font-mono text-ink">CANCEL PREMIUM</span> to Ava on Telegram.</p>
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="inline-block font-medium text-primary underline underline-offset-4">Open Telegram</a>
              </section>
            )}

            <section className={`${card} space-y-3`}>
              <h2 className="font-display text-xl font-semibold">Account</h2>
              <p className="text-muted-ink">Telegram ID: <span className="font-mono text-ink">{user.telegram_id}</span></p>
              <p className="text-muted-ink">Plan: <span className="font-semibold text-ink">{user.plan}</span></p>
              <div className="border-t border-line pt-4">
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} className="font-semibold text-destructive underline underline-offset-4 hover:no-underline">
                    Delete my account and data
                  </button>
                ) : (
                  <div className="space-y-3" role="alertdialog" aria-label="Confirm account deletion">
                    <p className="font-semibold text-destructive">This permanently deletes your account and everything Ava remembers. It cannot be undone.</p>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={deleteAccount} className="h-11 rounded-full bg-destructive px-5 font-semibold text-destructive-foreground hover:opacity-90">
                        Yes, delete everything
                      </button>
                      <button onClick={() => setDeleteConfirm(false)} className="h-11 rounded-full border border-primary px-5 font-medium text-primary hover:bg-wash">
                        Keep my account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="flex justify-center gap-6 pb-4 pt-2">
          <Link href="/privacy" className="py-2 text-sm text-muted-ink hover:text-primary hover:underline">Privacy</Link>
          <Link href="/terms" className="py-2 text-sm text-muted-ink hover:text-primary hover:underline">Terms</Link>
        </div>
      </main>
      {nav}
    </div>
  );
}
