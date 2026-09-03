'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardData { user: any; cycle: any; logs: any[]; }

const categoryColor: Record<string, string> = {
  symptom: 'bg-red-50 text-red-600', mood: 'bg-yellow-50 text-yellow-700',
  cycle: 'bg-pink-50 text-pink-600', sexual: 'bg-purple-50 text-purple-600',
  chat: 'bg-blue-50 text-blue-600', flow: 'bg-rose-50 text-rose-600',
  bbt: 'bg-green-50 text-green-600', mucus: 'bg-teal-50 text-teal-600',
  insight: 'bg-gray-50 text-gray-600', test: 'bg-orange-50 text-orange-600',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cycleForm, setCycleForm] = useState({ last_period: '', cycle_length: '', period_duration: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'settings'>('overview');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => {
        if (d) {
          setData(d);
          setCycleForm({
            last_period: d.cycle?.period_start_dates?.slice(-1)[0] || '',
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

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
      <div className="text-4xl animate-pulse">🌸</div>
    </div>
  );

  if (!data) return null;
  const { user, cycle, logs } = data;
  const isPremium = user.plan === 'premium';
  const expiresAt = user.premium_expires_at
    ? new Date(user.premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—';

  return (
    <main className="min-h-screen bg-[#FFF5F7]">
      {/* Header */}
      <div className="bg-[#E91E63] text-white px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs opacity-75">Dashboard</div>
          <div className="text-lg font-bold">{user.name} 🌸</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
            {isPremium ? '✨ Premium' : 'Free'}
          </span>
          <a href="/api/auth/logout" className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">Logout</a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pink-100 bg-white">
        {(['overview', 'log', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-[#E91E63] border-b-2 border-[#E91E63]' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Your Cycle</h2>
                <button onClick={() => setEditing(!editing)} className="text-xs text-[#E91E63] font-medium">
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Last period start</label>
                    <input type="date" value={cycleForm.last_period}
                      onChange={e => setCycleForm(f => ({ ...f, last_period: e.target.value }))}
                      className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Cycle length (days)</label>
                      <input type="number" value={cycleForm.cycle_length}
                        onChange={e => setCycleForm(f => ({ ...f, cycle_length: e.target.value }))}
                        className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Period duration (days)</label>
                      <input type="number" value={cycleForm.period_duration}
                        onChange={e => setCycleForm(f => ({ ...f, period_duration: e.target.value }))}
                        className="w-full border border-pink-100 rounded-xl px-3 py-2 text-sm mt-1" />
                    </div>
                  </div>
                  <button onClick={saveCycle} disabled={saving}
                    className="w-full bg-[#E91E63] text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Cycle length', value: cycle?.avg_cycle_length ? `${cycle.avg_cycle_length} days` : '—' },
                    { label: 'Period duration', value: cycle?.period_duration ? `${cycle.period_duration} days` : '—' },
                    { label: 'Next period', value: fmt(cycle?.next_period_start) },
                    { label: 'Ovulation', value: fmt(cycle?.next_ovulation_start) },
                  ].map(item => (
                    <div key={item.label} className="bg-[#FFF5F7] rounded-xl p-3">
                      <div className="text-xs text-gray-400">{item.label}</div>
                      <div className="text-sm font-semibold text-[#E91E63]">{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium card */}
            {!isPremium ? (
              <div className="bg-[#FCE4EC] rounded-2xl p-5 border-2 border-[#E91E63] space-y-3">
                <div className="font-bold text-[#E91E63]">✨ Upgrade — ₦2,000/month</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 5 months of memory</li>
                  <li>• Morning digest at 8am</li>
                  <li>• Monthly cycle PDF</li>
                  <li>• Ovulation strip reading</li>
                </ul>
                <a href={`https://t.me/Ava_care_bot`} target="_blank"
                  className="inline-block bg-[#E91E63] text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  Upgrade via Telegram
                </a>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 space-y-2">
                <div className="text-sm font-semibold text-yellow-800">✨ Premium active{expiresAt ? ` until ${expiresAt}` : ''}</div>
                <button onClick={() => setActiveTab('settings')}
                  className="text-xs text-yellow-700 underline">Manage subscription</button>
              </div>
            )}
          </>
        )}

        {/* ── Log Tab ── */}
        {activeTab === 'log' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Health Log</h2>
              <span className="text-xs text-gray-400">{isPremium ? 'Last 5 months' : 'Last 14 days'}</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No entries yet — chat with Ava to build your log.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 whitespace-nowrap ${categoryColor[log.category] || 'bg-gray-50 text-gray-500'}`}>
                      {log.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700">{log.summary}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.logged_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {isPremium && (
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <h2 className="font-bold text-gray-800">Subscription</h2>
                <div className="text-sm text-gray-600">
                  Status: <span className="text-yellow-600 font-semibold">✨ Premium</span>
                  {expiresAt && <span className="text-gray-400"> · expires {expiresAt}</span>}
                </div>
                <p className="text-xs text-gray-400">To cancel, send <span className="font-mono bg-gray-100 px-1 rounded">CANCEL PREMIUM</span> to Ava on Telegram.</p>
                <a href="https://t.me/Ava_care_bot" target="_blank"
                  className="inline-block text-sm text-[#E91E63] font-medium">Open Telegram →</a>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-gray-800">Account</h2>
              <div className="text-sm text-gray-500">Telegram ID: <span className="font-mono">{user.telegram_id}</span></div>
              <div className="text-sm text-gray-500">Plan: <span className="font-semibold">{user.plan}</span></div>
              <div className="pt-2 border-t border-gray-100">
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium">
                    Delete my account & data
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={deleteAccount}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                        Yes, delete everything
                      </button>
                      <button onClick={() => setDeleteConfirm(false)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-6 pb-8 pt-2">
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</Link>
          <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">Terms</Link>
        </div>
      </div>
    </main>
  );
}
