'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Faq } from '@/lib/admin/content-ai';

export async function api<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

export const inputCls = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink/60 focus:border-primary';

export function Field({ label, hint, right, children }: { label: string; hint?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {right}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-ink">{hint}</span>}
    </label>
  );
}

export function Counter({ value, max }: { value: number; max: number }) {
  return <span className={`text-xs tabular-nums ${value > max ? 'font-semibold text-red-600' : 'text-muted-ink'}`}>{value}/{max}</span>;
}

type Variant = 'primary' | 'ghost' | 'danger' | 'amber';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  ghost: 'border border-line bg-white text-ink hover:border-primary hover:text-primary',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  amber: 'bg-marigold text-ink hover:opacity-90',
};

export function Btn({ variant = 'ghost', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...props} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`} />;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode }) {
  const t = { info: 'border-line bg-wash text-ink', warn: 'border-amber-300 bg-amber-50 text-amber-900', error: 'border-red-300 bg-red-50 text-red-800', ok: 'border-emerald-300 bg-emerald-50 text-emerald-900' }[tone];
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${t}`}>{children}</div>;
}

export function FaqEditor({ value, onChange }: { value: Faq[]; onChange: (v: Faq[]) => void }) {
  const set = (i: number, patch: Partial<Faq>) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line bg-white p-3">
          <input className={inputCls} placeholder="Question" value={f.q} onChange={e => set(i, { q: e.target.value })} />
          <textarea className={`${inputCls} min-h-[72px]`} placeholder="Answer (plain text)" value={f.a} onChange={e => set(i, { a: e.target.value })} />
          <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <Btn onClick={() => onChange([...value, { q: '', a: '' }])}>Add question</Btn>
    </div>
  );
}
