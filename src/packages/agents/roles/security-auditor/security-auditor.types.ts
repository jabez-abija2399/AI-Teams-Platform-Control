/**
 * @file security-auditor.types.ts
 * @package @ai-teams/agents/roles/security-auditor
 * @description Types for the Security & Compliance Auditor Agent.
 */

import { z } from 'zod';

export const SecurityAuditReportSchema = z.object({
  vulnerabilitiesFound: z.array(z.object({
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    rule: z.string(),
    description: z.string(),
    recommendedFix: z.string(),
  })),
  owaspTop10CompliancePercent: z.number().min(0).max(100),
  passedSecurityGate: z.boolean(),
});
export type SecurityAuditReport = z.infer<typeof SecurityAuditReportSchema>;

export interface SecurityAuditorExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
}
