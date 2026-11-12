'use client';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Tool UIs other than the original three. Each is its own chunk, so a tool page
// only downloads its own calculator. Register `components/tools/<id>.tsx` here.
export const TOOL_UI: Record<string, ComponentType> = {
  'genotype-compatibility': dynamic(() => import('./genotype-compatibility')),
  'blood-group-rh-pregnancy': dynamic(() => import('./blood-group-rh-pregnancy')),
  'pregnancy-weeks-to-months': dynamic(() => import('./pregnancy-weeks-to-months')),
  'corrected-age-calculator': dynamic(() => import('./corrected-age-calculator')),
  'vaccination-schedule': dynamic(() => import('./vaccination-schedule')),
  'pregnancy-test-timing': dynamic(() => import('./pregnancy-test-timing')),
  'missed-pill-calculator': dynamic(() => import('./missed-pill-calculator')),
  'emergency-contraception-window': dynamic(() => import('./emergency-contraception-window')),
  'sti-hiv-window-period': dynamic(() => import('./sti-hiv-window-period')),
  'lam-postpartum-fertility': dynamic(() => import('./lam-postpartum-fertility')),
  'period-return-timeline': dynamic(() => import('./period-return-timeline')),
  'implantation-bleeding-vs-period': dynamic(() => import('./implantation-bleeding-vs-period')),
  'irregular-cycle-predictor': dynamic(() => import('./irregular-cycle-predictor')),
  'widal-test-explainer': dynamic(() => import('./widal-test-explainer')),
  'lab-reference-ranges': dynamic(() => import('./lab-reference-ranges')),
};
