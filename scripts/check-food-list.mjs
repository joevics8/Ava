// Validates food list files without needing the index:  node scripts/check-food-list.mjs nigeria ghana west-africa ...
// (With no arguments it checks every file in lib/ava/food/data/.)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const TAGS = ['iron', 'energy', 'protein', 'magnesium', 'mood', 'hydration', 'fiber', 'comfort', 'carbs', 'strength', 'digestion'];
const MIN_PER_TAG = { iron: 4, energy: 5, protein: 5, magnesium: 4, mood: 4, hydration: 4, fiber: 4, comfort: 4, carbs: 4, strength: 3, digestion: 4 };
const BANNED = /calor|kcal|\bmacro|detox|cleanse|fat[- ]burn|weight[- ]loss|slimming|diet pill|boost fertility|cure|\d/i;
const dir = new URL('../lib/ava/food/data/', import.meta.url);
const slugs = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(dir).filter(f => f.endsWith('.ts')).map(f => f.slice(0, -3));
let bad = 0;
for (const slug of slugs) {
  const file = new URL(`${slug}.ts`, dir);
  const errs = [];
  if (!existsSync(file)) { console.log(`✗ ${slug}: file missing`); bad++; continue; }
  const src = readFileSync(file, 'utf8');
  if (!/export const foods\s*:\s*FoodTuple\[\]/.test(src)) errs.push('must contain: export const foods: FoodTuple[] = [');
  const re = /\[\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,\s*(?:'([^']*)'|"([^"]*)")\s*\]/g;
  const items = []; let m;
  while ((m = re.exec(src))) items.push([(m[1] ?? m[2]).replace(/\\'/g, "'"), (m[3] ?? m[4]).trim()]);
  const names = new Set(); const count = Object.fromEntries(TAGS.map(t => [t, 0]));
  for (const [name, tags] of items) {
    const k = name.toLowerCase();
    if (names.has(k)) errs.push(`duplicate: ${name}`); names.add(k);
    if (name.length < 2 || name.length > 45) errs.push(`name length: ${name}`);
    if (BANNED.test(name)) errs.push(`banned wording/digit: ${name}`);
    const t = tags.split(/\s+/).filter(Boolean);
    if (t.length < 1 || t.length > 3) errs.push(`1-3 tags needed: ${name}`);
    for (const x of t) { if (!TAGS.includes(x)) errs.push(`bad tag "${x}" on ${name}`); else count[x]++; }
  }
  if (items.length < 55 || items.length > 100) errs.push(`need 55–100 foods, found ${items.length}`);
  for (const t of TAGS) if (count[t] < MIN_PER_TAG[t]) errs.push(`tag "${t}" has ${count[t]}, needs ≥ ${MIN_PER_TAG[t]}`);
  if (errs.length) { bad++; console.log(`✗ ${slug} (${items.length} foods)\n   ` + errs.slice(0, 12).join('\n   ')); }
  else console.log(`✓ ${slug} (${items.length} foods)`);
}
process.exit(bad ? 1 : 0);
