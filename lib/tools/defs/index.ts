import type { Tool } from '../types';
import { tool as genotypeCompatibility } from './genotype-compatibility';
import { tool as bloodGroup } from './blood-group-rh-pregnancy';
import { tool as weeksToMonths } from './pregnancy-weeks-to-months';
import { tool as correctedAge } from './corrected-age-calculator';
import { tool as vaccination } from './vaccination-schedule';
import { tool as testTiming } from './pregnancy-test-timing';
import { tool as missedPill } from './missed-pill-calculator';
import { tool as emergencyContraception } from './emergency-contraception-window';
import { tool as stiWindow } from './sti-hiv-window-period';
import { tool as lam } from './lam-postpartum-fertility';
import { tool as periodReturn } from './period-return-timeline';
import { tool as implantation } from './implantation-bleeding-vs-period';
import { tool as irregularCycle } from './irregular-cycle-predictor';
import { tool as widal } from './widal-test-explainer';
import { tool as labRanges } from './lab-reference-ranges';

import { tool as conceptionDateCalculator } from './conception-date-calculator';
import { tool as cycleDayCalculator } from './cycle-day-calculator';
import { tool as lhSurgeOvulationCalculator } from './lh-surge-ovulation-calculator';
import { tool as safePeriodCalculator } from './safe-period-calculator';
import { tool as bbtOvulationChecker } from './bbt-ovulation-checker';
import { tool as perimenopauseSymptomChecker } from './perimenopause-symptom-checker';
import { tool as pregnancyWeightGainCalculator } from './pregnancy-weight-gain-calculator';
import { tool as pregnancyCalorieWaterCalculator } from './pregnancy-calorie-water-calculator';
import { tool as lochiaPostpartumBleedingTimeline } from './lochia-postpartum-bleeding-timeline';
import { tool as breastMilkStorageGuide } from './breast-milk-storage-guide';
import { tool as babyGenderChart } from './baby-gender-chart';
// Each new tool lives in its own file in this folder (export `tool`) and is
// added to this list. The page UI for a tool is in components/tools/<id>.tsx and
// is registered in components/tools/index.tsx.
export const NEW_TOOLS: Tool[] = [
  genotypeCompatibility,
  bloodGroup,
  weeksToMonths,
  correctedAge,
  vaccination,
  testTiming,
  missedPill,
  emergencyContraception,
  stiWindow,
  lam,
  periodReturn,
  implantation,
  irregularCycle,
  widal,
  labRanges,
  breastMilkStorageGuide,
  lochiaPostpartumBleedingTimeline,
  pregnancyCalorieWaterCalculator,
  pregnancyWeightGainCalculator,
  perimenopauseSymptomChecker,
  bbtOvulationChecker,
  safePeriodCalculator,
  lhSurgeOvulationCalculator,
  cycleDayCalculator,
  conceptionDateCalculator,
  babyGenderChart,
];
