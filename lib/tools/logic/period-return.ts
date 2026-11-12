// Typical time until periods return in common situations. Ranges are broad,
// mainstream figures (NHS / ACOG / WHO) and are always shown as "typical", never as a promise.
import { addDays } from '../calculators';

export type Scenario = 'birth-not-breastfeeding' | 'birth-breastfeeding' | 'miscarriage-or-abortion' | 'stop-combined-pill' | 'stop-injection' | 'remove-implant-or-iud';

export interface ScenarioInfo {
  id: Scenario;
  label: string;
  dateLabel: string;
  /** Typical range in days from the event date. */
  startDays: number;
  endDays: number;
  /** Optional "average" marker in days. */
  typicalDays?: number;
  /** Days after the event after which it is worth asking a clinician if no period has come. Null when it depends on feeding. */
  askAfterDays: number | null;
  wide: boolean;
  summary: string;
  notes: string[];
}

export const SCENARIOS: Record<Scenario, ScenarioInfo> = {
  'birth-not-breastfeeding': {
    id: 'birth-not-breastfeeding', label: 'After having a baby, not breastfeeding', dateLabel: 'Date of birth', startDays: 42, endDays: 84, askAfterDays: 112, wide: false,
    summary: 'Periods usually return about 6 to 12 weeks after birth.',
    notes: ['Bleeding in the first weeks after birth (lochia) is not a period.', 'You can ovulate, and get pregnant, from about 3 weeks after birth, before your first period.'],
  },
  'birth-breastfeeding': {
    id: 'birth-breastfeeding', label: 'After having a baby, breastfeeding', dateLabel: 'Date of birth', startDays: 90, endDays: 365, askAfterDays: null, wide: true,
    summary: 'This varies widely. If you feed only breast milk, day and night, periods are often absent for several months. They often return as feeds reduce or solid food starts.',
    notes: ['Fertility can return before your first period, so do not rely on "no period yet" alone for contraception.', 'Periods can come back sooner, for example when feeds become less frequent, or later than a year for some people.', 'Ask a clinician if you are worried, or if you stopped breastfeeding more than 3 months ago and still have no period.'],
  },
  'miscarriage-or-abortion': {
    id: 'miscarriage-or-abortion', label: 'After a miscarriage or abortion', dateLabel: 'Date of the miscarriage or procedure', startDays: 28, endDays: 42, askAfterDays: 56, wide: false,
    summary: 'The first period usually comes 4 to 6 weeks afterwards.',
    notes: ['Ovulation can happen within about 2 weeks, so you can become pregnant before your first period.', 'Seek care the same day for heavy bleeding (soaking a pad every hour for 2 hours), severe pain, fever or foul-smelling discharge.'],
  },
  'stop-combined-pill': {
    id: 'stop-combined-pill', label: 'After stopping the combined pill', dateLabel: 'Date you took your last pill', startDays: 30, endDays: 90, askAfterDays: 120, wide: false,
    summary: 'Natural periods usually return within 1 to 3 months, though for some people it takes longer.',
    notes: ['You may have a withdrawal bleed within a few days of stopping. It is not the same as a natural period.', 'You can ovulate, and get pregnant, in the first cycle after stopping.', 'Irregular cycles at first are common and often settle.'],
  },
  'stop-injection': {
    id: 'stop-injection', label: 'After stopping the contraceptive injection', dateLabel: 'Date of your last injection', startDays: 90, endDays: 365, typicalDays: 300, askAfterDays: 548, wide: true,
    summary: 'Return of periods can take several months. On average it is about 10 months from your last injection, and it can take up to a year or longer.',
    notes: ['Count from the date of your last injection, not from when it was due to wear off.', 'You can ovulate before your first period, so use contraception if you do not want to become pregnant.', 'If you want to get pregnant, tell a clinician. They can advise on timing.'],
  },
  'remove-implant-or-iud': {
    id: 'remove-implant-or-iud', label: 'After removing an implant or IUD/IUS (coil)', dateLabel: 'Date it was removed', startDays: 21, endDays: 84, askAfterDays: 120, wide: false,
    summary: 'Fertility usually returns quickly. Periods typically return within a few weeks to 3 months.',
    notes: ['You can become pregnant straight away, so use contraception if you do not want to.', 'If you used a hormonal method, your first cycles can be irregular.', 'A copper IUD does not stop periods, so your usual cycle simply carries on.'],
  },
};

export interface ReturnWindow {
  info: ScenarioInfo;
  start: Date;
  end: Date;
  typical: Date | null;
  askFrom: Date | null;
  /** Where today falls: before the window, inside it, or after it. */
  phase: 'before' | 'within' | 'after';
}

const DAY = 86_400_000;
const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export function periodReturnWindow(scenario: Scenario, event: Date, today: Date): ReturnWindow | null {
  const info = SCENARIOS[scenario];
  const since = Math.floor((utcMidnight(today) - utcMidnight(event)) / DAY);
  if (since < 0) return null;
  return {
    info,
    start: addDays(event, info.startDays),
    end: addDays(event, info.endDays),
    typical: info.typicalDays ? addDays(event, info.typicalDays) : null,
    askFrom: info.askAfterDays === null ? null : addDays(event, info.askAfterDays),
    phase: since < info.startDays ? 'before' : since <= info.endDays ? 'within' : 'after',
  };
}
