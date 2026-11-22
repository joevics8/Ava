import { AsyncLocalStorage } from 'async_hooks';

// Every "today", cycle day and greeting is computed in the USER's time zone. Instead of passing a zone
// through dozens of functions, the webhook and each cron set it once per user (useUserTimezone) and the
// date helpers read it (currentTz). With nothing set they use Lagos, the app's original behaviour.

export const DEFAULT_TZ = 'Africa/Lagos';
const store = new AsyncLocalStorage<string>();

export const currentTz = (): string => store.getStore() ?? DEFAULT_TZ;

/** Use this user's zone for the rest of the current request/loop iteration. */
export function useUserTimezone(tz: string | null | undefined): void {
  store.enterWith(tz && isValidTimezone(tz) ? tz : DEFAULT_TZ);
}

export function isValidTimezone(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

/** A Date whose UTC fields are the wall-clock fields in `tz` (so getUTCHours() is her local hour). */
export function wallClock(now: Date = new Date(), tz: string = currentTz()): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now);
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return new Date(Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second')));
}

export const localDateIn = (now: Date = new Date(), tz: string = currentTz()): string => wallClock(now, tz).toISOString().slice(0, 10);
export const localHour = (now: Date = new Date(), tz: string = currentTz()): number => wallClock(now, tz).getUTCHours();

export function greetingFor(hour: number): 'morning' | 'afternoon' | 'evening' {
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

// ── Country → zone (the most populated zone for big countries; /timezone fixes the rest) ──
const C: Record<string, string> = {
  nigeria: 'Africa/Lagos', ghana: 'Africa/Accra', kenya: 'Africa/Nairobi', 'south africa': 'Africa/Johannesburg', egypt: 'Africa/Cairo',
  ethiopia: 'Africa/Addis_Ababa', tanzania: 'Africa/Dar_es_Salaam', uganda: 'Africa/Kampala', rwanda: 'Africa/Kigali', zambia: 'Africa/Lusaka',
  zimbabwe: 'Africa/Harare', cameroon: 'Africa/Douala', senegal: 'Africa/Dakar', "cote d'ivoire": 'Africa/Abidjan', 'ivory coast': 'Africa/Abidjan',
  morocco: 'Africa/Casablanca', algeria: 'Africa/Algiers', tunisia: 'Africa/Tunis', angola: 'Africa/Luanda', mozambique: 'Africa/Maputo',
  namibia: 'Africa/Windhoek', botswana: 'Africa/Gaborone', malawi: 'Africa/Blantyre', 'sierra leone': 'Africa/Freetown', liberia: 'Africa/Monrovia',
  gambia: 'Africa/Banjul', benin: 'Africa/Porto-Novo', togo: 'Africa/Lome', niger: 'Africa/Niamey', mali: 'Africa/Bamako', 'burkina faso': 'Africa/Ouagadougou',
  'united kingdom': 'Europe/London', uk: 'Europe/London', england: 'Europe/London', scotland: 'Europe/London', wales: 'Europe/London', ireland: 'Europe/Dublin',
  france: 'Europe/Paris', germany: 'Europe/Berlin', spain: 'Europe/Madrid', italy: 'Europe/Rome', portugal: 'Europe/Lisbon', netherlands: 'Europe/Amsterdam',
  belgium: 'Europe/Brussels', switzerland: 'Europe/Zurich', sweden: 'Europe/Stockholm', norway: 'Europe/Oslo', denmark: 'Europe/Copenhagen', poland: 'Europe/Warsaw',
  turkey: 'Europe/Istanbul', greece: 'Europe/Athens', russia: 'Europe/Moscow', ukraine: 'Europe/Kyiv',
  'united states': 'America/New_York', usa: 'America/New_York', us: 'America/New_York', america: 'America/New_York', canada: 'America/Toronto',
  mexico: 'America/Mexico_City', brazil: 'America/Sao_Paulo', argentina: 'America/Argentina/Buenos_Aires', colombia: 'America/Bogota', peru: 'America/Lima',
  chile: 'America/Santiago', venezuela: 'America/Caracas', jamaica: 'America/Jamaica', 'trinidad and tobago': 'America/Port_of_Spain', 'puerto rico': 'America/Puerto_Rico',
  'dominican republic': 'America/Santo_Domingo', ecuador: 'America/Guayaquil', bolivia: 'America/La_Paz', 'costa rica': 'America/Costa_Rica', panama: 'America/Panama',
  india: 'Asia/Kolkata', pakistan: 'Asia/Karachi', bangladesh: 'Asia/Dhaka', 'sri lanka': 'Asia/Colombo', nepal: 'Asia/Kathmandu',
  'united arab emirates': 'Asia/Dubai', uae: 'Asia/Dubai', 'saudi arabia': 'Asia/Riyadh', qatar: 'Asia/Qatar', kuwait: 'Asia/Kuwait', oman: 'Asia/Muscat', bahrain: 'Asia/Bahrain',
  israel: 'Asia/Jerusalem', jordan: 'Asia/Amman', lebanon: 'Asia/Beirut', iraq: 'Asia/Baghdad', iran: 'Asia/Tehran',
  china: 'Asia/Shanghai', japan: 'Asia/Tokyo', 'south korea': 'Asia/Seoul', korea: 'Asia/Seoul', philippines: 'Asia/Manila', indonesia: 'Asia/Jakarta',
  malaysia: 'Asia/Kuala_Lumpur', singapore: 'Asia/Singapore', thailand: 'Asia/Bangkok', vietnam: 'Asia/Ho_Chi_Minh', 'hong kong': 'Asia/Hong_Kong',
  australia: 'Australia/Sydney', 'new zealand': 'Pacific/Auckland',
};

export function tzForCountry(country: string | null | undefined): string {
  const key = (country ?? '').trim().toLowerCase().replace(/\./g, '').replace(/^the /, '');
  return C[key] ?? DEFAULT_TZ;
}

const CITY: Record<string, string> = {
  lagos: 'Africa/Lagos', abuja: 'Africa/Lagos', accra: 'Africa/Accra', nairobi: 'Africa/Nairobi', johannesburg: 'Africa/Johannesburg', cairo: 'Africa/Cairo',
  london: 'Europe/London', paris: 'Europe/Paris', berlin: 'Europe/Berlin', madrid: 'Europe/Madrid', dubai: 'Asia/Dubai', mumbai: 'Asia/Kolkata', delhi: 'Asia/Kolkata',
  'new york': 'America/New_York', chicago: 'America/Chicago', denver: 'America/Denver', 'los angeles': 'America/Los_Angeles', toronto: 'America/Toronto',
  houston: 'America/Chicago', atlanta: 'America/New_York', miami: 'America/New_York', 'sao paulo': 'America/Sao_Paulo', singapore: 'Asia/Singapore',
  tokyo: 'Asia/Tokyo', sydney: 'Australia/Sydney', manila: 'Asia/Manila',
};

/** "Europe/Paris", "paris", "UTC+2", "GMT-5" -> an IANA zone, or null. */
export function parseTimezoneInput(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 40) return null;
  const off = raw.match(/^(?:utc|gmt)\s*([+-])\s*(\d{1,2})(?::?(00))?$/i);
  if (off) {
    const h = Number(off[2]);
    if (h > 14 || (off[1] === '-' && h > 12)) return null;
    if (h === 0) return 'UTC';
    return `Etc/GMT${off[1] === '+' ? '-' : '+'}${h}`; // Etc/GMT signs are inverted
  }
  const city = CITY[raw.toLowerCase()];
  if (city) return city;
  const iana = raw.replace(/\s+/g, '_');
  if (/^[A-Za-z_]+\/[A-Za-z_\/+-]+$/.test(iana) && isValidTimezone(iana)) return iana;
  const fromCountry = C[raw.toLowerCase()];
  return fromCountry ?? null;
}

/** "14:05 (Africa/Lagos)" style text so she can confirm it is right. */
export function describeLocalTime(tz: string, now: Date = new Date()): string {
  const w = wallClock(now, tz);
  return `${String(w.getUTCHours()).padStart(2, '0')}:${String(w.getUTCMinutes()).padStart(2, '0')}`;
}

export const MORNING_HOUR = (): number => (Number(process.env.MORNING_LOCAL_HOUR) >= 0 && process.env.MORNING_LOCAL_HOUR !== undefined && process.env.MORNING_LOCAL_HOUR !== '' ? Number(process.env.MORNING_LOCAL_HOUR) : 6);

/** Is the local time at/after `hour` (default MORNING_LOCAL_HOUR, 6) and the morning message not yet sent for her local date? */
export function morningDue(tz: string, lastSentOn: string | null | undefined, now: Date = new Date(), hour = MORNING_HOUR()): boolean {
  return localHour(now, tz) >= hour && lastSentOn !== localDateIn(now, tz);
}
