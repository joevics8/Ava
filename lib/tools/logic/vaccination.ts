import { addDays } from '@/lib/tools/calculators';
import { addMonths, addYears, diffDays } from './pregnancy-dates';

// Two simplified routine child schedules. National schedules differ (brands,
// number of doses, ages), so this is a guide to the TYPICAL ages. The child's own
// vaccination card and clinic always decide what is due.

export type Age = { w: number } | { m: number } | { y: number };
export type PresetId = 'who' | 'cdc';
export type Status = 'upcoming' | 'due-now' | 'past';

interface Dose {
  vaccine: string;
  dose: string;
  protects: string;
  at: Age;
  /** End of the usual window. Defaults to 4 weeks after `at`. */
  until?: Age;
  /** Shown as a tag when only some countries give it. */
  regional?: string;
  note?: string;
}

export interface Preset {
  id: PresetId;
  label: string;
  source: string;
  footnotes: string[];
  doses: Dose[];
}

const d = (vaccine: string, dose: string, protects: string, at: Age, until?: Age, extra: Partial<Dose> = {}): Dose => ({ vaccine, dose, protects, at, until, ...extra });
const W = (w: number): Age => ({ w });
const M = (m: number): Age => ({ m });
const Y = (y: number): Age => ({ y });

export const PRESETS: Record<PresetId, Preset> = {
  who: {
    id: 'who',
    label: 'WHO routine schedule (6, 10 and 14 weeks)',
    source: 'Simplified from the World Health Organization routine immunization recommendations. Countries adapt it, so ages and vaccines vary.',
    footnotes: [
      'Where the schedule gives two or three doses a few weeks apart, the real timing depends on when the previous dose was given. A late dose is still given; ask your clinic about catch-up.',
      'Some countries give a second IPV dose at about 9 months or use a different number of doses for PCV and rotavirus vaccines.',
      'Vitamin A is a supplement, not a vaccine. Where it is recommended it is repeated every 4 to 6 months until 5 years old.',
    ],
    doses: [
      d('BCG', 'Single dose', 'Severe tuberculosis in children', W(0), M(12), { note: 'As soon as possible after birth.' }),
      d('Hepatitis B', 'Birth dose', 'Hepatitis B', W(0), W(1), { note: 'Ideally within 24 hours of birth.' }),
      d('Oral polio (OPV)', 'Birth dose (OPV0)', 'Polio', W(0), W(2), { regional: 'Where oral polio vaccine is used' }),
      d('DTP-HepB-Hib (pentavalent)', 'Dose 1', 'Diphtheria, tetanus, whooping cough, hepatitis B, Hib', W(6)),
      d('Oral polio (OPV)', 'Dose 1', 'Polio', W(6), undefined, { regional: 'Where oral polio vaccine is used' }),
      d('Pneumococcal (PCV)', 'Dose 1', 'Pneumococcal pneumonia and meningitis', W(6)),
      d('Rotavirus', 'Dose 1', 'Severe diarrhoea from rotavirus', W(6)),
      d('DTP-HepB-Hib (pentavalent)', 'Dose 2', 'Diphtheria, tetanus, whooping cough, hepatitis B, Hib', W(10)),
      d('Oral polio (OPV)', 'Dose 2', 'Polio', W(10), undefined, { regional: 'Where oral polio vaccine is used' }),
      d('Pneumococcal (PCV)', 'Dose 2', 'Pneumococcal pneumonia and meningitis', W(10)),
      d('Rotavirus', 'Dose 2', 'Severe diarrhoea from rotavirus', W(10), undefined, { note: 'Some rotavirus vaccines need a third dose at 14 weeks.' }),
      d('DTP-HepB-Hib (pentavalent)', 'Dose 3', 'Diphtheria, tetanus, whooping cough, hepatitis B, Hib', W(14)),
      d('Oral polio (OPV)', 'Dose 3', 'Polio', W(14), undefined, { regional: 'Where oral polio vaccine is used' }),
      d('Pneumococcal (PCV)', 'Dose 3', 'Pneumococcal pneumonia and meningitis', W(14)),
      d('Inactivated polio (IPV)', 'Dose 1', 'Polio', W(14)),
      d('Malaria vaccine', 'Dose 1', 'Malaria', M(5), M(6), { regional: 'Where malaria is common and the vaccine is offered' }),
      d('Vitamin A', 'Supplement', 'Vitamin A deficiency', M(6), M(11), { regional: 'Where vitamin A deficiency is common' }),
      d('Malaria vaccine', 'Dose 2', 'Malaria', M(6), M(7), { regional: 'Where malaria is common and the vaccine is offered' }),
      d('Malaria vaccine', 'Dose 3', 'Malaria', M(7), M(8), { regional: 'Where malaria is common and the vaccine is offered' }),
      d('Measles-rubella', 'Dose 1', 'Measles and rubella', M(9), M(12)),
      d('Yellow fever', 'Single dose', 'Yellow fever', M(9), M(12), { regional: 'Countries where yellow fever occurs' }),
      d('DTP-containing booster', 'Booster', 'Diphtheria, tetanus, whooping cough', M(12), M(23)),
      d('Measles-rubella', 'Dose 2', 'Measles and rubella', M(15), M(18)),
      d('Malaria vaccine', 'Dose 4', 'Malaria', M(19), M(25), { regional: 'Where malaria is common and the vaccine is offered', note: 'Usually 12 to 18 months after dose 3.' }),
      d('DTP or Td booster', 'Booster', 'Diphtheria and tetanus', Y(4), Y(7)),
      d('HPV', '1 or 2 doses', 'Cervical and other cancers caused by HPV', Y(9), Y(14), { regional: 'Offered to girls in most countries; some include boys' }),
      d('Td booster', 'Booster', 'Tetanus and diphtheria', Y(9), Y(15)),
    ],
  },
  cdc: {
    id: 'cdc',
    label: 'US CDC-style schedule (2, 4 and 6 months)',
    source: 'Simplified from the US Centers for Disease Control and Prevention child and adolescent schedule. The CDC updates it, so check the current version.',
    footnotes: [
      'Flu vaccine is recommended every year from 6 months old (two doses the first season). COVID-19 and RSV protection follow current national advice.',
      'Some brands need a different number of doses (for example rotavirus and Hib), so your clinic may skip a dose listed here.',
      'Where two doses are separated by a set gap (such as hepatitis A), the second dose depends on when the first was given.',
    ],
    doses: [
      d('Hepatitis B', 'Dose 1', 'Hepatitis B', W(0), W(4), { note: 'Within 24 hours of birth when the baby is well.' }),
      d('Hepatitis B', 'Dose 2', 'Hepatitis B', M(1), M(2)),
      d('Rotavirus', 'Dose 1', 'Severe diarrhoea from rotavirus', M(2), M(3)),
      d('DTaP', 'Dose 1', 'Diphtheria, tetanus, whooping cough', M(2), M(3)),
      d('Hib', 'Dose 1', 'Haemophilus influenzae type b (meningitis, pneumonia)', M(2), M(3)),
      d('Pneumococcal (PCV)', 'Dose 1', 'Pneumococcal disease', M(2), M(3)),
      d('Inactivated polio (IPV)', 'Dose 1', 'Polio', M(2), M(3)),
      d('Rotavirus', 'Dose 2', 'Severe diarrhoea from rotavirus', M(4), M(5)),
      d('DTaP', 'Dose 2', 'Diphtheria, tetanus, whooping cough', M(4), M(5)),
      d('Hib', 'Dose 2', 'Haemophilus influenzae type b', M(4), M(5)),
      d('Pneumococcal (PCV)', 'Dose 2', 'Pneumococcal disease', M(4), M(5)),
      d('Inactivated polio (IPV)', 'Dose 2', 'Polio', M(4), M(5)),
      d('Rotavirus', 'Dose 3', 'Severe diarrhoea from rotavirus', M(6), M(7), { note: 'Only for brands that use three doses.' }),
      d('DTaP', 'Dose 3', 'Diphtheria, tetanus, whooping cough', M(6), M(7)),
      d('Hib', 'Dose 3', 'Haemophilus influenzae type b', M(6), M(7), { note: 'Only for brands that use three doses.' }),
      d('Pneumococcal (PCV)', 'Dose 3', 'Pneumococcal disease', M(6), M(7)),
      d('Hepatitis B', 'Dose 3', 'Hepatitis B', M(6), M(18)),
      d('Inactivated polio (IPV)', 'Dose 3', 'Polio', M(6), M(18)),
      d('MMR', 'Dose 1', 'Measles, mumps, rubella', M(12), M(15)),
      d('Varicella', 'Dose 1', 'Chickenpox', M(12), M(15)),
      d('Hib', 'Booster', 'Haemophilus influenzae type b', M(12), M(15)),
      d('Pneumococcal (PCV)', 'Booster', 'Pneumococcal disease', M(12), M(15)),
      d('Hepatitis A', 'Dose 1', 'Hepatitis A', M(12), M(23)),
      d('DTaP', 'Dose 4', 'Diphtheria, tetanus, whooping cough', M(15), M(18)),
      d('Hepatitis A', 'Dose 2', 'Hepatitis A', M(18), M(41), { note: 'At least 6 months after dose 1.' }),
      d('DTaP', 'Dose 5', 'Diphtheria, tetanus, whooping cough', Y(4), Y(7)),
      d('Inactivated polio (IPV)', 'Dose 4', 'Polio', Y(4), Y(7)),
      d('MMR', 'Dose 2', 'Measles, mumps, rubella', Y(4), Y(7)),
      d('Varicella', 'Dose 2', 'Chickenpox', Y(4), Y(7)),
      d('Tdap', 'Booster', 'Tetanus, diphtheria, whooping cough', Y(11), Y(13)),
      d('HPV', 'Dose 1', 'Cancers caused by HPV', Y(11), Y(13), { note: 'Can start from age 9. Younger starters need two doses, 6 to 12 months apart.' }),
      d('Meningococcal (MenACWY)', 'Dose 1', 'Meningococcal disease', Y(11), Y(13)),
    ],
  },
};

export const MAX_AGE_YEARS = 16;

export function ageToDate(dob: Date, age: Age): Date {
  if ('w' in age) return addDays(dob, age.w * 7);
  if ('m' in age) return addMonths(dob, age.m);
  return addYears(dob, age.y);
}

export interface ScheduleRow {
  vaccine: string;
  dose: string;
  protects: string;
  from: Date;
  until: Date;
  status: Status;
  regional?: string;
  note?: string;
  /** Days until the window opens (upcoming) or since it closed (past). */
  days: number;
}

export function statusFor(from: Date, until: Date, today: Date): Status {
  if (today.getTime() < from.getTime()) return 'upcoming';
  return today.getTime() <= until.getTime() ? 'due-now' : 'past';
}

/** Null when the birth date is in the future or too long ago for a child schedule. */
export function buildSchedule(preset: PresetId, dob: Date, today: Date): ScheduleRow[] | null {
  const age = diffDays(dob, today);
  if (age < 0 || age > MAX_AGE_YEARS * 366) return null;
  return PRESETS[preset].doses
    .map(x => {
      const from = ageToDate(dob, x.at);
      const until = x.until ? ageToDate(dob, x.until) : addDays(from, 28);
      const status = statusFor(from, until, today);
      return {
        vaccine: x.vaccine, dose: x.dose, protects: x.protects, from, until, status, regional: x.regional, note: x.note,
        days: status === 'upcoming' ? diffDays(today, from) : status === 'past' ? diffDays(until, today) : 0,
      };
    })
    .sort((a, b) => a.from.getTime() - b.from.getTime());
}
