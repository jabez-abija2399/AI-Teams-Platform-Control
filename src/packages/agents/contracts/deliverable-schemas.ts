/**
 * @file deliverable-schemas.ts
 * @package @ai-teams/agents/contracts
 * @description Strict Zod validation schemas for all project deliverables produced by AI Agents.
 */

import { z } from 'zod';

export const BusinessStrategySchema = z.object({
  problemStatement: z.string().min(10),
  targetAudience: z.array(z.string()).min(1),
  uniqueValueProposition: z.string().min(10),
  corePillars: z.array(z.string()).min(1),
  monetizationModel: z.string().optional(),
  mvpScope: z.array(z.string()).min(1),
  recommendedTechStackSummary: z.string().optional(),
});
export type BusinessStrategy = z.infer<typeof BusinessStrategySchema>;

export const ProductRequirementsDocSchema = z.object({
  productName: z.string(),
  executiveSummary: z.string(),
  targetUserPersonas: z.array(z.object({
    role: z.string(),
    goals: z.array(z.string()),
    painPoints: z.array(z.string()),
  })),
  featureEpics: z.array(z.object({
    epicId: z.string(),
    title: z.string(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    userStories: z.array(z.object({
      id: z.string(),
      asA: z.string(),
      iWantTo: z.string(),
      soThat: z.string(),
      acceptanceCriteria: z.array(z.string()),
    })),
  })),
  outOfScope: z.array(z.string()).optional(),
});
export type ProductRequirementsDoc = z.infer<typeof ProductRequirementsDocSchema>;

export const ArchitectureSpecSchema = z.object({
  techStack: z.object({
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    styling: z.string(),
    keyLibraries: z.array(z.string()),
  }),
  fileTree: z.array(z.object({
    path: z.string(),
    purpose: z.string(),
  })),
  databaseSchema: z.object({
    models: z.array(z.object({
      name: z.string(),
      fields: z.array(z.string()),
    })),
  }).optional(),
  apiEndpoints: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    description: z.string(),
  })),
  implementationTodos: z.array(z.object({
    file: z.string(),
    action: z.enum(['CREATE', 'MODIFY', 'DELETE']),
    description: z.string(),
  })),
});
export type ArchitectureSpec = z.infer<typeof ArchitectureSpecSchema>;

export const UIDesignSpecSchema = z.object({
  colorPalette: z.object({
    primary: z.string(),
    background: z.string(),
    card: z.string(),
    accent: z.string(),
    textPrimary: z.string(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    monoFont: z.string(),
  }),
  componentHierarchy: z.array(z.object({
    name: z.string(),
    location: z.string(),
    stylingRules: z.string(),
  })),
  responsiveBreakpoints: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string(),
  }),
});
export type UIDesignSpec = z.infer<typeof UIDesignSpecSchema>;

export const ImplementationDeliverableSchema = z.object({
  generatedFiles: z.array(z.object({
    path: z.string(),
    content: z.string(),
    language: z.string().optional(),
  })),
  totalLOC: z.number().nonnegative(),
  executionSummary: z.string(),
});
export type ImplementationDeliverable = z.infer<typeof ImplementationDeliverableSchema>;

export const QAVerificationReportSchema = z.object({
  testSuitePassRatePercent: z.number().min(0).max(100),
  totalTestsRun: z.number().nonnegative(),
  testsPassed: z.number().nonnegative(),
  testsFailed: z.number().nonnegative(),
  defectsTriaged: z.array(z.object({
    severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
    description: z.string(),
    fileLocation: z.string().optional(),
  })),
  releaseReadinessVerdict: z.enum(['PASSED', 'NEEDS_FIXES', 'FAILED']),
});
export type QAVerificationReport = z.infer<typeof QAVerificationReportSchema>;
