// ─── Countries → regions ────────────────────────────────────────────────────
//
// Onboarding (and /settings → My country) stores whatever the user typed in
// users.country. This file turns that free text into a canonical country,
// and every country into one of FOOD_REGIONS, so food suggestions can fall
// back from "country list" → "region list" → "general list".
//
// Pure data + string matching: no Node-only imports (client pages may import it).

export type RegionId =
  | 'west-africa' | 'east-africa' | 'central-southern-africa' | 'north-africa'
  | 'middle-east' | 'south-asia' | 'southeast-asia' | 'east-asia' | 'central-asia-caucasus'
  | 'northern-western-europe' | 'southern-europe' | 'eastern-europe'
  | 'north-america' | 'caribbean' | 'central-america' | 'south-america' | 'oceania-pacific';

export interface Region { id: RegionId; label: string }

// Order = order of the buttons shown when someone has to pick a region.
export const REGIONS: Region[] = [
  { id: 'west-africa', label: '🌍 West Africa' },
  { id: 'east-africa', label: '🌍 East Africa' },
  { id: 'central-southern-africa', label: '🌍 Central & Southern Africa' },
  { id: 'north-africa', label: '🌍 North Africa' },
  { id: 'middle-east', label: '🕌 Middle East' },
  { id: 'south-asia', label: '🌏 South Asia' },
  { id: 'southeast-asia', label: '🌏 Southeast Asia' },
  { id: 'east-asia', label: '🌏 East Asia' },
  { id: 'central-asia-caucasus', label: '🌏 Central Asia & Caucasus' },
  { id: 'northern-western-europe', label: '🌍 Northern & Western Europe' },
  { id: 'southern-europe', label: '🌍 Southern Europe & Balkans' },
  { id: 'eastern-europe', label: '🌍 Eastern Europe' },
  { id: 'north-america', label: '🌎 North America' },
  { id: 'caribbean', label: '🌴 Caribbean' },
  { id: 'central-america', label: '🌎 Central America' },
  { id: 'south-america', label: '🌎 South America' },
  { id: 'oceania-pacific', label: '🌏 Oceania & Pacific' },
];

export const REGION_IDS = REGIONS.map(r => r.id);
export const isRegionId = (v: unknown): v is RegionId => typeof v === 'string' && (REGION_IDS as string[]).includes(v);
export const regionLabel = (id: RegionId): string => REGIONS.find(r => r.id === id)?.label.replace(/^\S+\s/, '') ?? id;

export interface Country {
  name: string;
  region: RegionId;
  /** Key of this country's own food list (lib/ava/food/data/<slug>.ts), when it has one. */
  foodSlug?: string;
}

// "Name|alias|alias" per entry. Aliases are extra spellings/abbreviations; the name itself is always matched.
// An `=slug` suffix on the name marks the 50 countries that have their own food list.
const BY_REGION: Record<RegionId, string[]> = {
  'west-africa': [
    'Nigeria=nigeria|ng|naija|federal republic of nigeria', 'Ghana=ghana|gh', "Senegal=senegal|sn", "Côte d'Ivoire=ivory-coast|cote d'ivoire|ivory coast|cote divoire|ci",
    'Benin|republic of benin', 'Burkina Faso', 'Cape Verde|cabo verde', 'Gambia|the gambia', 'Guinea', 'Guinea-Bissau|guinea bissau', 'Liberia', 'Mali',
    'Mauritania', 'Niger', 'Sierra Leone', 'Togo',
  ],
  'east-africa': [
    'Kenya=kenya|ke', 'Ethiopia=ethiopia|et', 'Tanzania=tanzania|tz|united republic of tanzania', 'Uganda=uganda|ug',
    'Rwanda', 'Burundi', 'Comoros', 'Djibouti', 'Eritrea', 'Madagascar', 'Malawi', 'Mauritius', 'Mozambique', 'Seychelles', 'Somalia', 'South Sudan', 'Sudan',
  ],
  'central-southern-africa': [
    'South Africa=south-africa|za|rsa|s africa', 'Cameroon=cameroon|cm|cameroun', 'Zambia=zambia|zm', 'Zimbabwe=zimbabwe|zw',
    'Angola', 'Botswana', 'Central African Republic|car', 'Chad', 'Congo|republic of the congo|congo brazzaville', 'DR Congo|democratic republic of the congo|drc|congo kinshasa|dr congo',
    'Equatorial Guinea', 'Eswatini|swaziland', 'Gabon', 'Lesotho', 'Namibia', 'São Tomé and Príncipe|sao tome and principe|sao tome',
  ],
  'north-africa': ['Egypt=egypt|eg', 'Morocco=morocco|ma', 'Algeria', 'Libya', 'Tunisia'],
  'middle-east': [
    'United Arab Emirates=uae|uae|u a e|emirates|united arab emirate', 'Saudi Arabia=saudi-arabia|ksa|saudi|kingdom of saudi arabia', 'Turkey=turkey|turkiye|türkiye|tr',
    'Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Syria', 'Yemen',
  ],
  'south-asia': [
    'India=india|in|bharat', 'Pakistan=pakistan|pk', 'Bangladesh=bangladesh|bd', 'Sri Lanka=sri-lanka|lk|srilanka',
    'Nepal', 'Afghanistan', 'Bhutan', 'Maldives',
  ],
  'southeast-asia': [
    'Philippines=philippines|ph|the philippines', 'Indonesia=indonesia|id', 'Malaysia=malaysia|my', 'Thailand=thailand|th', 'Vietnam=vietnam|vn|viet nam',
    'Singapore', 'Brunei', 'Cambodia', 'Laos', 'Myanmar|burma', 'Timor-Leste|east timor',
  ],
  'east-asia': [
    'China=china|cn|prc|peoples republic of china', 'Japan=japan|jp', 'South Korea=south-korea|korea|republic of korea|sk|south korea|kr',
    'Hong Kong', 'Macau|macao', 'Mongolia', 'North Korea', 'Taiwan',
  ],
  'central-asia-caucasus': ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan', 'Armenia', 'Azerbaijan', 'Georgia'],
  'northern-western-europe': [
    'United Kingdom=united-kingdom|uk|u k|gb|great britain|britain|england|scotland|wales|northern ireland|united kingdom of great britain',
    'Ireland=ireland|ie|republic of ireland|eire', 'France=france|fr', 'Germany=germany|de|deutschland', 'Netherlands=netherlands|nl|holland|the netherlands',
    'Austria', 'Belgium', 'Denmark', 'Estonia', 'Finland', 'Iceland', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Monaco', 'Norway', 'Sweden', 'Switzerland',
  ],
  'southern-europe': [
    'Spain=spain|es|espana|españa', 'Italy=italy|it|italia', 'Portugal=portugal|pt', 'Greece=greece|gr',
    'Albania', 'Andorra', 'Bosnia and Herzegovina|bosnia', 'Croatia', 'Cyprus', 'Kosovo', 'Malta', 'Montenegro', 'North Macedonia|macedonia', 'San Marino', 'Serbia', 'Slovenia', 'Vatican City|vatican',
  ],
  'eastern-europe': ['Poland=poland|pl', 'Belarus', 'Bulgaria', 'Czechia|czech republic', 'Hungary', 'Moldova', 'Romania', 'Russia|russian federation', 'Slovakia', 'Ukraine'],
  'north-america': [
    'United States=united-states|usa|us|u s a|u s|america|united states of america|the united states|the us|the usa', 'Canada=canada|ca',
    'Bermuda', 'Greenland',
  ],
  'caribbean': [
    'Jamaica=jamaica|jm', 'Antigua and Barbuda', 'Bahamas|the bahamas', 'Barbados', 'Cuba', 'Dominica', 'Dominican Republic', 'Grenada', 'Guyana', 'Haiti',
    'Puerto Rico', 'Saint Kitts and Nevis|st kitts and nevis|st kitts', 'Saint Lucia|st lucia', 'Saint Vincent and the Grenadines|st vincent', 'Suriname', 'Trinidad and Tobago|trinidad|tobago|t&t',
  ],
  'central-america': ['Mexico=mexico|mx|méxico', 'Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  'south-america': [
    'Brazil=brazil|br|brasil', 'Argentina=argentina|ar', 'Colombia=colombia|co', 'Peru=peru|pe|perú', 'Chile=chile|cl',
    'Bolivia', 'Ecuador', 'Paraguay', 'Uruguay', 'Venezuela',
  ],
  'oceania-pacific': [
    'Australia=australia|au|oz', 'New Zealand=new-zealand|nz|aotearoa',
    'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'Palau', 'Papua New Guinea|png', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu',
  ],
};

/** Every known country, keyed by normalised name/alias. */
const INDEX = new Map<string, Country>();
export const COUNTRIES: Country[] = [];

/** Lower-case, strip accents/punctuation/leading "the" so "The U.S.A." → "usa", "Côte d'Ivoire" → "cote divoire". */
export function normalizeCountryInput(raw: string): string {
  return raw
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^the /, '');
}

for (const [region, entries] of Object.entries(BY_REGION) as [RegionId, string[]][]) {
  for (const entry of entries) {
    const [head, ...aliases] = entry.split('|');
    const [name, tail] = head.split('=');
    // "Name=slug|alias..." — for these the text after "=" is the food slug, not an alias.
    const country: Country = { name, region, ...(tail ? { foodSlug: tail } : {}) };
    COUNTRIES.push(country);
    for (const key of [name, ...aliases]) {
      const k = normalizeCountryInput(key);
      if (k && !INDEX.has(k)) INDEX.set(k, country);
    }
  }
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1); // substitution
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return s.slice(i) === l.slice(i + 1); // insertion / deletion
}

/**
 * Free text → country. Exact (normalised) match first, then a single unambiguous
 * one-typo match for names of 5+ letters ("Nigria", "Ghanna"). Returns null for anything
 * else — callers then ask for a region instead of guessing.
 */
export function resolveCountry(input: string | null | undefined): Country | null {
  if (!input) return null;
  const key = normalizeCountryInput(input);
  if (!key) return null;
  const exact = INDEX.get(key);
  if (exact) return exact;
  // "lagos, nigeria" / "kumasi ghana" — accept a trailing known country.
  const parts = key.split(' ');
  for (let n = Math.min(3, parts.length - 1); n >= 1; n--) {
    const tail = INDEX.get(parts.slice(-n).join(' '));
    if (tail) return tail;
  }
  if (key.length < 5) return null;
  const hits = new Set<Country>();
  INDEX.forEach((c, k) => { if (k.length >= 5 && editDistanceAtMostOne(key, k)) hits.add(c); });
  return hits.size === 1 ? Array.from(hits)[0] : null;
}

/** The region for a user: their country's own region wins; otherwise the one they picked. */
export function regionFor(country: string | null | undefined, picked?: string | null): RegionId | null {
  return resolveCountry(country)?.region ?? (isRegionId(picked) ? picked : null);
}
