/**
 * @file devops-engineer.types.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Types and Zod schemas for the DevOps Engineer Agent.
 */

import { z } from 'zod';
import {
  DeploymentRecipeSchema,
  type DeploymentRecipe,
  type ArchitectureSpec,
} from '../../contracts/deliverable-schemas';

export { DeploymentRecipeSchema, type DeploymentRecipe };

export interface DevopsExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  architectureSpec?: ArchitectureSpec;
}

export type DevopsDeliverable = DeploymentRecipe;

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const cicdPipelineSchema = z.object({
  name: smartString.default('Continuous Integration'),
  trigger: smartString.default('push on main / pr'),
  stages: z.array(smartString).default(['lint', 'test', 'build', 'security-scan', 'deploy']),
});

export const githubActionSchema = z.object({
  workflowName: smartString.default('ci-cd.yml'),
  description: smartString.default('Automated build and test'),
  yamlContent: smartString.default('name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest'),
});

export const deploymentStepSchema = z.object({
  step: z.number().default(1),
  name: smartString.default(''),
  description: smartString.default(''),
  command: smartString.default(''),
});

export const envVarSchema = z.object({
  key: smartString.default(''),
  description: smartString.default(''),
  required: z.boolean().default(true),
  isSecret: z.boolean().default(false),
});

export const secretsStrategySchema = z.object({
  tool: smartString.default('AWS Secrets Manager / Vault / SealedSecrets'),
  rotationIntervalDays: z.number().default(90),
  accessControl: smartString.default('IAM role based access'),
}).default({ tool: 'AWS Secrets Manager / Vault / SealedSecrets', rotationIntervalDays: 90, accessControl: 'IAM role based access' });

export const scalingPlanSchema = z.object({
  minInstances: z.number().default(2),
  maxInstances: z.number().default(10),
  targetCpuUtilization: z.number().default(70),
  autoScalingPolicy: smartString.default('Horizontal Pod Autoscaler (HPA)'),
}).default({ minInstances: 2, maxInstances: 10, targetCpuUtilization: 70, autoScalingPolicy: 'Horizontal Pod Autoscaler (HPA)' });

export const monitoringPlanSchema = z.object({
  metricsPlatform: smartString.default('Prometheus / Grafana / Datadog'),
  keyMetrics: z.array(smartString).default(['cpu_usage', 'memory_usage', 'http_request_duration_seconds', 'error_rate']),
  alertThresholds: z.array(smartString).default(['error_rate > 1% for 5m', 'p95_latency > 500ms']),
}).default({
  metricsPlatform: 'Prometheus / Grafana / Datadog',
  keyMetrics: ['cpu_usage', 'memory_usage', 'http_request_duration_seconds', 'error_rate'],
  alertThresholds: ['error_rate > 1% for 5m', 'p95_latency > 500ms'],
});

export const loggingPlanSchema = z.object({
  logAggregation: smartString.default('ELK / Datadog / Loki'),
  retentionDays: z.number().default(30),
  structuredLogging: z.boolean().default(true),
}).default({ logAggregation: 'ELK / Datadog / Loki', retentionDays: 30, structuredLogging: true });

export const backupPlanSchema = z.object({
  schedule: smartString.default('Daily snapshots, WAL archiving'),
  retentionDays: z.number().default(30),
  disasterRecoveryRTO: smartString.default('4 hours'),
  disasterRecoveryRPO: smartString.default('1 hour'),
}).default({ schedule: 'Daily snapshots, WAL archiving', retentionDays: 30, disasterRecoveryRTO: '4 hours', disasterRecoveryRPO: '1 hour' });

export const rollbackStrategySchema = z.object({
  mechanism: smartString.default('Blue/Green or Canary deployment with automated health check revert'),
  triggers: z.array(smartString).default(['Health check failure 3 consecutive times', 'Error rate spike > 5%']),
  maxRollbackTimeSeconds: z.number().default(120),
}).default({
  mechanism: 'Blue/Green or Canary deployment with automated health check revert',
  triggers: ['Health check failure 3 consecutive times', 'Error rate spike > 5%'],
  maxRollbackTimeSeconds: 120,
});

export const healthCheckSchema = z.object({
  endpoint: smartString.default('/healthz'),
  type: z.enum(['liveness', 'readiness', 'startup']).default('liveness'),
  intervalSeconds: z.number().default(10),
  timeoutSeconds: z.number().default(3),
});

export const prodChecklistItemSchema = z.object({
  item: smartString.default(''),
  verified: z.boolean().default(false),
  category: z.enum(['security', 'reliability', 'performance', 'monitoring']).default('reliability'),
});

export const devopsPlanSpecSchema = z.object({
  docker: smartString.default('FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nCMD ["npm", "start"]'),
  dockerCompose: smartString.default('version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"'),
  cicdPipelines: z.array(cicdPipelineSchema).default([]),
  githubActions: z.array(githubActionSchema).default([]),
  deploymentPlan: z.array(deploymentStepSchema).default([]),
  environmentVariables: z.array(envVarSchema).default([]),
  secretsManagement: secretsStrategySchema,
  scalingStrategy: scalingPlanSchema,
  monitoringStrategy: monitoringPlanSchema,
  loggingStrategy: loggingPlanSchema,
  backupDisasterRecovery: backupPlanSchema,
  rollbackPlan: rollbackStrategySchema,
  healthChecks: z.array(healthCheckSchema).default([]),
  productionChecklist: z.array(prodChecklistItemSchema).default([]),
  status: smartString.default('APPROVED'),
});

export type DevopsPlanSpec = z.infer<typeof devopsPlanSpecSchema>;
export type DevopsAnalysis = DevopsPlanSpec;
