import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const empathyMapSchema = z.object({
  personaId: smartString.default('PER-001'),
  says: z.array(smartString).default([]),
  thinks: z.array(smartString).default([]),
  does: z.array(smartString).default([]),
  feels: z.array(smartString).default([]),
});

export const userJourneyStepSchema = z.object({
  stepNumber: z.number().default(1),
  userAction: smartString.default(''),
  touchpoint: smartString.default(''),
  emotion: smartString.default('Neutral'),
  painPoint: smartString.default(''),
  opportunity: smartString.default(''),
});

export const userJourneySchema = z.object({
  id: smartString.default('UJW-001'),
  title: smartString.default(''),
  personaId: smartString.default('PER-001'),
  scenario: smartString.default(''),
  steps: z.array(userJourneyStepSchema).default([]),
});

export const screenInventoryItemSchema = z.object({
  screenId: smartString.default('SCR-001'),
  name: smartString.default(''),
  purpose: smartString.default(''),
  keyElements: z.array(smartString).default([]),
  navigationLinks: z.array(smartString).default([]),
});

export const uxResearchSpecSchema = z.object({
  userJourney: z.array(userJourneySchema).default([]),
  empathyMap: z.array(empathyMapSchema).default([]),
  painPoints: z.array(z.object({
    id: smartString.default('PP-001'),
    description: smartString.default(''),
    severity: smartString.default('MEDIUM'),
    affectedPersona: smartString.default(''),
  })).default([]),
  personas: z.array(z.object({
    id: smartString.default('PER-001'),
    name: smartString.default(''),
    psychologicalTraits: z.array(smartString).default([]),
    technicalProficiency: smartString.default('Average'),
    motivations: z.array(smartString).default([]),
  })).default([]),
  navigationFlow: z.array(z.object({
    fromScreen: smartString.default(''),
    action: smartString.default(''),
    toScreen: smartString.default(''),
  })).default([]),
  informationArchitecture: z.object({
    siteMap: z.array(smartString).default([]),
    hierarchy: z.array(smartString).default([]),
    searchAndDiscovery: smartString.default(''),
  }).default({ siteMap: [], hierarchy: [], searchAndDiscovery: '' }),
  accessibilityReport: z.object({
    targetStandard: smartString.default('WCAG 2.1 AA'),
    colorContrastRequirements: smartString.default('4.5:1 for normal text'),
    screenReaderConsiderations: z.array(smartString).default([]),
    keyboardNavigationRules: z.array(smartString).default([]),
  }).default({ targetStandard: 'WCAG 2.1 AA', colorContrastRequirements: '4.5:1 for normal text', screenReaderConsiderations: [], keyboardNavigationRules: [] }),
  interactionPrinciples: z.array(z.object({
    principle: smartString.default(''),
    guideline: smartString.default(''),
    rationale: smartString.default(''),
  })).default([]),
  usabilityRisks: z.array(z.object({
    risk: smartString.default(''),
    likelihood: smartString.default('LOW'),
    mitigation: smartString.default(''),
  })).default([]),
  researchSummary: z.object({
    overview: smartString.default(''),
    keyFindings: z.array(smartString).default([]),
    targetCognitiveLoad: smartString.default('Low'),
  }).default({ overview: '', keyFindings: [], targetCognitiveLoad: 'Low' }),
  recommendations: z.array(smartString).default([]),
  wireframeDescriptions: z.array(z.object({
    screenId: smartString.default(''),
    layoutDescription: smartString.default(''),
    responsiveNotes: smartString.default(''),
  })).default([]),
  screenInventory: z.array(screenInventoryItemSchema).default([]),
  status: smartString.default('APPROVED'),
});

export type UxResearchSpec = z.infer<typeof uxResearchSpecSchema>;
