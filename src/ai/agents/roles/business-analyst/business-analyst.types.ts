import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const businessRuleSchema = z.object({
  id: smartString.default('BR-001'),
  category: smartString.default('Business Logic'),
  rule: smartString.default(''),
  enforcement: smartString.default('Strict'),
  errorCondition: smartString.default(''),
});

export const useCaseSchema = z.object({
  id: smartString.default('UC-001'),
  title: smartString.default(''),
  actor: smartString.default(''),
  preconditions: z.array(smartString).default([]),
  mainFlow: z.array(smartString).default([]),
  postconditions: z.array(smartString).default([]),
});

export const traceabilityItemSchema = z.object({
  prdStoryId: smartString.default('US-001'),
  srsSpecId: smartString.default('SRS-001'),
  testCaseId: smartString.default('TC-001'),
  coverageStatus: smartString.default('Covered'),
});

export const softwareRequirementSpecSchema = z.object({
  srs: z.object({
    title: smartString.default('Software Requirements Specification'),
    version: smartString.default('v1.0.0'),
    scope: smartString.default(''),
    overview: smartString.default(''),
  }).default({ title: 'Software Requirements Specification', version: 'v1.0.0', scope: '', overview: '' }),
  businessRules: z.array(businessRuleSchema).default([]),
  processFlows: z.array(z.object({
    id: smartString.default('PF-001'),
    name: smartString.default(''),
    steps: z.array(smartString).default([]),
  })).default([]),
  useCases: z.array(useCaseSchema).default([]),
  actors: z.array(z.object({
    name: smartString.default(''),
    role: smartString.default(''),
    permissions: z.array(smartString).default([]),
  })).default([]),
  traceabilityMatrix: z.array(traceabilityItemSchema).default([]),
  functionalSpecs: z.array(z.object({
    id: smartString.default('FS-001'),
    module: smartString.default(''),
    specification: smartString.default(''),
    gherkinCriteria: smartString.default(''),
  })).default([]),
  nonFunctionalSpecs: z.array(z.object({
    category: smartString.default(''),
    metric: smartString.default(''),
    target: smartString.default(''),
  })).default([]),
  edgeCases: z.array(z.object({
    scenario: smartString.default(''),
    expectedBehavior: smartString.default(''),
  })).default([]),
  validationRules: z.array(z.object({
    field: smartString.default(''),
    rule: smartString.default(''),
  })).default([]),
  riskAnalysis: z.array(z.object({
    risk: smartString.default(''),
    impact: smartString.default(''),
    mitigation: smartString.default(''),
  })).default([]),
  dependencyMapping: z.array(z.object({
    source: smartString.default(''),
    target: smartString.default(''),
    nature: smartString.default(''),
  })).default([]),
  decisionTables: z.array(z.object({
    name: smartString.default(''),
    conditions: z.array(smartString).default([]),
    actions: z.array(smartString).default([]),
  })).default([]),
  acceptanceMatrix: z.array(z.object({
    requirementId: smartString.default(''),
    verificationMethod: smartString.default('Automated Test'),
    status: smartString.default('Pending'),
  })).default([]),
  complexityEstimate: z.object({
    overallEffort: smartString.default('MEDIUM'),
    criticalPath: z.union([
      z.array(smartString),
      smartString.transform((val) => {
        if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return [val];
      }),
    ]).default([]),
  }).default({ overallEffort: 'MEDIUM', criticalPath: [] }),
  status: smartString.default('APPROVED'),
});

export type SoftwareRequirementSpec = z.infer<typeof softwareRequirementSpecSchema>;
