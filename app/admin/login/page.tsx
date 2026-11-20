'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (res.ok) { window.location.href = '/admin'; return; }
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Could not sign in.');
    } catch { setError('Network error. Try again.'); }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-bold">Verm admin</h1>
      <p className="mt-1 text-sm text-muted-ink">Sign in with your admin account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Email
          <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">Password
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-normal" />
        </label>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
