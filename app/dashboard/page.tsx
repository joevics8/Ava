'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  user: any;
  cycle: any;
  logs: any[];
}

const phaseEmoji: Record<string, string> = {
  menstrual: '🔴', follicular: '🌱', ovulation: '✨', luteal: '🌙',
};

const categoryColor: Record<string, string> = {
  symptom: 'bg-red-50 text-red-600',
  mood: 'bg-yellow-50 text-yellow-700',
  cycle: 'bg-pink-50 text-pink-600',
  sexual: 'bg-purple-50 text-purple-600',
  chat: 'bg-blue-50 text-blue-600',
  flow: 'bg-rose-50 text-rose-600',
  bbt: 'bg-green-50 text-green-600',
  mucus: 'bg-teal-50 text-teal-600',
  insight: 'bg-gray-50 text-gray-600',
  test: 'bg-orange-50 text-orange-600',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
      <div className="text-4xl animate-pulse">🌸</div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center text-gray-500">
      {error || 'Something went wrong'}
    </div>
  );

  const { user, cycle, logs } = data;
  const isPremium = user.plan === 'premium';
  const expiresAt = user.premium_expires_at
    ? new Date(user.premium_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const nextPeriod = cycle?.next_period_start
    ? new Date(cycle.next_period_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    : '—';
  const nextOvulation = cycle?.next_ovulation_start
    ? new Date(cycle.next_ovulation_start).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <main className="min-h-screen bg-[#FFF5F7]">
      {/* Header */}
      <div className="bg-[#E91E63] text-white px-6 py-5 flex items-center justify-between">
        <div>
          <div className="text-sm opacity-80">Good to see you</div>
          <div className="text-xl font-bold">{user.name} 🌸</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${isPremium ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
            {isPremium ? '✨ Premium' : 'Free'}
          </span>
          <a href="https://t.me/AvaByVerm_bot" target="_blank"
            className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
            Open Bot
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Cycle overview */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-800 text-lg">Your Cycle</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Avg cycle length', value: cycle?.avg_cycle_length ? `${cycle.avg_cycle_length} days` : '—' },
              { label: 'Period duration', value: cycle?.period_duration ? `${cycle.period_duration} days` : '—' },
              { label: 'Next period', value: nextPeriod },
              { label: 'Ovulation window', value: nextOvulation },
            ].map(item => (
              <div key={item.label} className="bg-[#FFF5F7] rounded-xl p-3">
                <div className="text-xs text-gray-400">{item.label}</div>
                <div className="text-base font-semibold text-[#E91E63]">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400">
            Confidence: {cycle?.confidence_pct || 70}% · Based on {cycle?.period_start_dates?.length || 1} period date(s)
          </div>
        </div>

        {/* Premium status */}
        {!isPremium && (
          <div className="bg-[#FCE4EC] rounded-2xl p-5 border-2 border-[#E91E63] space-y-3">
            <div className="font-bold text-[#E91E63]">✨ Upgrade to Premium — ₦2,000/month</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 5 months of memory (vs 2 weeks)</li>
              <li>• Morning digest at 8am daily</li>
              <li>• Monthly cycle PDF report</li>
              <li>• Ovulation test strip reading</li>
            </ul>
            <a href="https://t.me/AvaByVerm_bot" target="_blank"
              className="inline-block bg-[#E91E63] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#C2185B] transition-colors">
              Upgrade via Telegram
            </a>
          </div>
        )}

        {isPremium && expiresAt && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 text-sm text-yellow-800">
            ✨ Premium active until {expiresAt}
          </div>
        )}

        {/* Memory log */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-lg">Your Health Log</h2>
            <span className="text-xs text-gray-400">
              {isPremium ? 'Last 5 months' : 'Last 14 days'}
            </span>
          </div>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No entries yet — start chatting with Ava to build your log.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
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

        {/* Footer */}
        <div className="text-center space-y-2 pb-8">
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 mx-3">Privacy</Link>
          <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 mx-3">Terms</Link>
        </div>
      </div>
    </main>
  );
}
