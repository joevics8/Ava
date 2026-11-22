import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// A Supabase write whose result is thrown away fails silently (the error is only in the return value).
// Every write must go through must()/logged() from lib/supabase-util, or read its { error }.
function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '__tests__' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('Supabase writes', () => {
  it('never discard their result', () => {
    const offenders: string[] = [];
    for (const f of [...walk('app'), ...walk('lib')]) {
      const s = fs.readFileSync(f, 'utf8');
      const re = /(^|\n)[ \t]*await\s+supabaseAdmin\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s))) {
        let depth = 0, i = m.index + m[0].length;
        for (; i < s.length; i++) {
          const c = s[i];
          if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--; else if (c === ';' && depth <= 0) break;
        }
        const stmt = s.slice(m.index, i + 1);
        if (/\.(insert|update|upsert|delete)\(|\.rpc\(/.test(stmt)) offenders.push(`${f}:${s.slice(0, m.index).split('\n').length + 1}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
