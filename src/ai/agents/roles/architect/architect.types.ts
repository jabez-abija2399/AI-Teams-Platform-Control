import { z } from 'zod';

export const ARCHITECT_CAPABILITIES = ['ARCHITECTURE', 'PLANNING', 'ANALYSIS'] as const;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const technicalArchitectureSchema = z.object({
  frontend: smartString.default('Not specified'),
  backend: smartString.default('Not specified'),
  database: smartString.default('Not specified'),
  infrastructure: smartString.default('Not specified'),
  security: smartString.default('Not specified'),
});
export type TechnicalArchitecture = z.infer<typeof technicalArchitectureSchema>;

export const databaseEntitySchema = z.object({
  name: smartString.default('Entity'),
  fields: z.array(z.object({ name: smartString, type: smartString })).default([]),
});

export const databaseDesignSchema = z.object({
  entities: z.array(databaseEntitySchema).default([]),
  relationships: z.array(smartString).default([]),
  indexes: z.array(smartString).default([]),
  constraints: z.array(smartString).default([]),
});
export type DatabaseDesign = z.infer<typeof databaseDesignSchema>;

export const apiEndpointSchema = z.object({
  path: smartString.default('/'),
  method: smartString.default('GET'),
  request: smartString.optional(),
  response: smartString.default('{}'),
});

export const apiSpecificationSchema = z.object({
  endpoints: z.array(apiEndpointSchema).default([]),
});
export type APISpecification = z.infer<typeof apiSpecificationSchema>;

export const technologyDecisionSchema = z.object({
  technology: smartString.default(''),
  reason: smartString.default(''),
  alternative: smartString.default(''),
  tradeoff: smartString.default(''),
});
export type TechnologyDecision = z.infer<typeof technologyDecisionSchema>;

export const qualityScoreSchema = z.object({
  completeness: z.number().min(1).max(10),
  technicalAccuracy: z.number().min(1).max(10),
  scalability: z.number().min(1).max(10),
  security: z.number().min(1).max(10),
  maintainability: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  verdict: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  notes: z.string().optional(),
});
export type QualityScore = z.infer<typeof qualityScoreSchema>;

export const architectAnalysisSchema = z.object({
  architecture: technicalArchitectureSchema,
  database: databaseDesignSchema,
  api: apiSpecificationSchema,
  decisions: z.array(technologyDecisionSchema).default([]),
  qualityScore: qualityScoreSchema.optional(),
});
export type ArchitectAnalysis = z.infer<typeof architectAnalysisSchema>;
