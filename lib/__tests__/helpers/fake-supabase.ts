// A small in-memory stand-in for the Supabase client, enough for the bot's queries.
// Rows live in `db.tables`. Supported: select/insert/update/upsert/delete, eq/neq/is/not/gt/gte/lt/lte/in,
// order/limit/range, single/maybeSingle, head+count, rpc (empty). `or()` and joins are not filtered.
import { randomUUID } from 'crypto';

type Row = Record<string, any>;
type Err = { message: string; code?: string } | null;

export class FakeDb {
  tables: Record<string, Row[]> = {};
  failures: { table: string; op: string; message: string }[] = [];

  seed(table: string, rows: Row[]) { this.tables[table] = [...(this.tables[table] ?? []), ...rows.map(r => ({ ...r }))]; return this; }
  rows(table: string): Row[] { return this.tables[table] ?? []; }
  /** The next `op` on `table` returns this error instead of working. */
  failNext(table: string, op: 'insert' | 'update' | 'delete' | 'select' | 'upsert', message = 'forced failure') { this.failures.push({ table, op, message }); }
  from(table: string) { return new Query(this, table); }
  rpc() { return Promise.resolve({ data: [], error: null }); }
}

class Query implements PromiseLike<{ data: any; error: Err; count?: number | null }> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private filters: ((r: Row) => boolean)[] = [];
  private payload: any = null;
  private upsertKey: string | null = null;
  private orderBy: { col: string; asc: boolean } | null = null;
  private lim: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private wantSingle: 'single' | 'maybe' | null = null;
  private head = false;
  private wantCount = false;
  private returning = false;

  constructor(private db: FakeDb, private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === 'select') { this.head = !!opts?.head; this.wantCount = !!opts?.count; } else this.returning = true;
    return this;
  }
  insert(rows: Row | Row[]) { this.op = 'insert'; this.payload = rows; return this; }
  update(patch: Row) { this.op = 'update'; this.payload = patch; return this; }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) { this.op = 'upsert'; this.payload = rows; this.upsertKey = opts?.onConflict ?? null; return this; }
  delete() { this.op = 'delete'; return this; }

  eq(c: string, v: any) { this.filters.push(r => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push(r => r[c] !== v); return this; }
  gt(c: string, v: any) { this.filters.push(r => r[c] > v); return this; }
  gte(c: string, v: any) { this.filters.push(r => r[c] >= v); return this; }
  lt(c: string, v: any) { this.filters.push(r => r[c] < v); return this; }
  lte(c: string, v: any) { this.filters.push(r => r[c] <= v); return this; }
  in(c: string, vs: any[]) { this.filters.push(r => vs.includes(r[c])); return this; }
  is(c: string, v: any) { this.filters.push(r => (v === null ? r[c] == null : r[c] === v)); return this; }
  not(c: string, op: string, v: any) { if (op === 'is' && v === null) this.filters.push(r => r[c] != null); return this; }
  or(_f: string) { return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending !== false }; return this; }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.rangeFrom = a; this.rangeTo = b; return this; }
  single() { this.wantSingle = 'single'; return this; }
  maybeSingle() { this.wantSingle = 'maybe'; return this; }

  then<T1, T2>(ok?: any, bad?: any): Promise<T1 | T2> { return Promise.resolve(this.run()).then(ok, bad); }

  private run(): { data: any; error: Err; count?: number | null } {
    const fi = this.db.failures.findIndex(f => f.table === this.table && f.op === this.op);
    if (fi >= 0) { const f = this.db.failures.splice(fi, 1)[0]; return { data: null, error: { message: f.message } }; }
    const all = (this.db.tables[this.table] ??= []);
    const match = (r: Row) => this.filters.every(f => f(r));
    let out: Row[] = [];

    if (this.op === 'insert' || this.op === 'upsert') {
      const list: Row[] = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r: Row): Row => ({ id: randomUUID(), created_at: new Date().toISOString(), ...r }));
      for (const r of list) {
        const key = this.op === 'upsert' ? (this.upsertKey ?? 'id') : null;
        const existing = key ? all.find(x => x[key] !== undefined && x[key] === r[key]) : null;
        if (existing) { Object.assign(existing, r); out.push(existing); } else { all.push(r); out.push(r); }
      }
    } else if (this.op === 'update') {
      for (const r of all) if (match(r)) { Object.assign(r, this.payload); out.push(r); }
    } else if (this.op === 'delete') {
      this.db.tables[this.table] = all.filter(r => { const m = match(r); if (m) out.push(r); return !m; });
    } else {
      out = all.filter(match);
    }

    if (this.orderBy) { const { col, asc } = this.orderBy; out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1)); }
    if (this.rangeFrom !== null) out = out.slice(this.rangeFrom, (this.rangeTo ?? out.length) + 1);
    if (this.lim !== null) out = out.slice(0, this.lim);
    const count = this.wantCount ? out.length : null;
    if (this.head) return { data: null, error: null, count };
    if (this.op !== 'select' && !this.returning) return { data: null, error: null };
    if (this.wantSingle === 'single') return out.length === 1 ? { data: out[0], error: null } : { data: null, error: { message: out.length ? 'multiple rows' : 'no rows', code: 'PGRST116' } };
    if (this.wantSingle === 'maybe') return { data: out[0] ?? null, error: null };
    return { data: out, error: null, count };
  }
}
