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
];
