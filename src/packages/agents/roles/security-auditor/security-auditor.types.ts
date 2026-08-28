/**
 * @file security-auditor.types.ts
 * @package @ai-teams/agents/roles/security-auditor
 * @description Types and Zod schemas for the Security Auditor Agent.
 */

import { z } from 'zod';
import {
  SecurityAuditReportSchema,
  type SecurityAuditReport,
  type ImplementationDeliverable,
} from '../../contracts/deliverable-schemas';

export { SecurityAuditReportSchema, type SecurityAuditReport };

export interface SecurityAuditorExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  implementation?: ImplementationDeliverable;
}

export type SecurityAuditorDeliverable = SecurityAuditReport;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const threatModelItemSchema = z.object({
  component: smartString.default(''),
  threat: smartString.default(''),
  strideCategory: z.enum(['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege']).default('Tampering'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  mitigation: smartString.default(''),
});

export const owaspFindingSchema = z.object({
  category: smartString.default('A01:2021-Broken Access Control'),
  status: z.enum(['PASS', 'FAIL', 'WARNING', 'NOT_APPLICABLE']).default('PASS'),
  notes: smartString.default(''),
});

export const authAuditSchema = z.object({
  mechanism: smartString.default(''),
  vulnerabilities: z.array(smartString).default([]),
  strengthScore: z.number().default(90),
}).default({ mechanism: 'JWT / OAuth2', vulnerabilities: [], strengthScore: 90 });

export const rbacAuditSchema = z.object({
  enforcement: smartString.default('Role-based middleware on all routes'),
  privilegeEscalationRisks: z.array(smartString).default([]),
  recommendations: z.array(smartString).default([]),
}).default({ enforcement: 'Role-based middleware on all routes', privilegeEscalationRisks: [], recommendations: [] });

export const depScanItemSchema = z.object({
  package: smartString.default(''),
  version: smartString.default(''),
  vulnerability: smartString.default(''),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('LOW'),
  remediation: smartString.default('Upgrade package version'),
});

export const secretDetectionSchema = z.object({
  hardcodedSecretsFound: z.boolean().default(false),
  locations: z.array(smartString).default([]),
  envManagementScore: z.number().default(100),
}).default({ hardcodedSecretsFound: false, locations: [], envManagementScore: 100 });

export const apiSecurityReviewSchema = z.object({
  rateLimitingEnforced: z.boolean().default(true),
  corsPolicy: smartString.default('Strict origin whitelist'),
  inputValidationScore: z.number().default(95),
  findings: z.array(smartString).default([]),
}).default({ rateLimitingEnforced: true, corsPolicy: 'Strict origin whitelist', inputValidationScore: 95, findings: [] });

export const infraReviewSchema = z.object({
  tlsEnforced: z.boolean().default(true),
  headers: z.array(smartString).default(['HSTS', 'CSP', 'X-Frame-Options', 'X-Content-Type-Options']),
  containerSecurity: smartString.default('Non-root user container execution'),
}).default({ tlsEnforced: true, headers: ['HSTS', 'CSP', 'X-Frame-Options', 'X-Content-Type-Options'], containerSecurity: 'Non-root user container execution' });

export const dataProtectionSchema = z.object({
  encryptionAtRest: smartString.default('AES-256'),
  encryptionInTransit: smartString.default('TLS 1.3'),
  piiHandling: smartString.default('Anonymization and strict access logging'),
}).default({ encryptionAtRest: 'AES-256', encryptionInTransit: 'TLS 1.3', piiHandling: 'Anonymization and strict access logging' });

export const complianceReportSchema = z.object({
  gdprReady: z.boolean().default(true),
  soc2Ready: z.boolean().default(true),
  hipaaReady: z.boolean().default(false),
  notes: smartString.default('Standard web SaaS compliance posture'),
}).default({ gdprReady: true, soc2Ready: true, hipaaReady: false, notes: 'Standard web SaaS compliance posture' });

export const riskScoreSchema = z.object({
  overallScore: z.number().default(90),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  summary: smartString.default('Strong defense-in-depth security posture'),
}).default({ overallScore: 90, riskLevel: 'LOW', summary: 'Strong defense-in-depth security posture' });

export const remediationPlanItemSchema = z.object({
  priority: z.enum(['IMMEDIATE', 'SHORT_TERM', 'LONG_TERM']).default('SHORT_TERM'),
  action: smartString.default(''),
  targetComponent: smartString.default(''),
  codeExample: smartString.default(''),
});

export const securityReportSpecSchema = z.object({
  threatModel: z.array(threatModelItemSchema).default([]),
  owaspReview: z.array(owaspFindingSchema).default([]),
  authenticationAudit: authAuditSchema,
  authorizationAudit: rbacAuditSchema,
  dependencyScan: z.array(depScanItemSchema).default([]),
  secretDetection: secretDetectionSchema,
  apiSecurityReview: apiSecurityReviewSchema,
  infrastructureReview: infraReviewSchema,
  dataProtectionReport: dataProtectionSchema,
  complianceReport: complianceReportSchema,
  riskScore: riskScoreSchema,
  remediationPlan: z.array(remediationPlanItemSchema).default([]),
  status: smartString.default('APPROVED'),
});

export type SecurityReportSpec = z.infer<typeof securityReportSpecSchema>;
export type SecurityAnalysis = SecurityReportSpec;
