// Plain-language reading of Widal titres. The Widal test has limited accuracy,
// so this is a rough band, not a diagnosis. Cut-offs differ by lab and region.

export const TITRES = [20, 40, 80, 160, 320, 640] as const;
export type Titre = (typeof TITRES)[number];
export const titreLabel = (t: number) => `1:${t}`;

export type Band = 'low' | 'borderline' | 'raised';

export interface WidalResult {
  band: Band;
  headline: string;
  points: string[];
  /** True when fever has lasted under a week, when the test can still be negative. */
  early: boolean;
  /** True when fever has lasted more than 3 days. */
  longFever: boolean;
}

export function widalBand(o: number, h: number): Band {
  if (o >= 160) return 'raised';
  if (o === 80 || h >= 160) return 'borderline';
  return 'low';
}

export function interpretWidal(o: number, h: number, feverDays: number | null): WidalResult {
  const band = widalBand(o, h);
  const points: string[] = [];
  const early = feverDays !== null && feverDays < 7;
  const longFever = feverDays !== null && feverDays > 3;

  if (band === 'raised') {
    points.push(`An O titre of ${titreLabel(o)} is at or above the level many labs treat as suggestive of typhoid exposure. It does not confirm typhoid.`);
    if (h >= 160) points.push('A raised H titre on its own is often from an old infection or vaccination, but together with a raised O titre it is more noticeable.');
  } else if (band === 'borderline') {
    points.push(o === 80
      ? `An O titre of ${titreLabel(o)} is in a grey zone: it can be a low background level or an early rise.`
      : `A raised H titre (${titreLabel(h)}) with a low O titre often reflects an old infection or vaccination rather than a current illness.`);
  } else {
    points.push('Both titres are low. That makes recent typhoid less likely, but it does not rule it out.');
  }
  if (early) points.push('The Widal test is often still negative or low in the first week of illness, because antibodies take time to rise. A repeat test 5 to 7 days later, showing a clear rise, is more meaningful than one result.');
  points.push('Blood culture, taken before antibiotics, is the more reliable test for typhoid.');

  const headline = band === 'raised' ? 'Raised: discuss with a clinician' : band === 'borderline' ? 'Borderline: a single result is hard to read' : 'Low: not suggestive on its own';
  return { band, headline, points, early, longFever };
}

export function parseFeverDays(text: string): { value: number | null; error?: string } {
  const t = text.trim();
  if (t === '') return { value: null };
  if (!/^\d+$/.test(t)) return { value: null, error: 'Enter days of fever as a whole number, or leave it blank.' };
  const n = Number(t);
  if (n > 60) return { value: null, error: 'Enter days of fever as a number up to 60, or leave it blank.' };
  return { value: n };
}
