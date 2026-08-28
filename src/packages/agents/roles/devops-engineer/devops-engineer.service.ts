/**
 * @file devops-engineer.service.ts
 * @package @ai-teams/agents/roles/devops-engineer
 * @description Deployment recipe and infrastructure generation service for the DevOps Engineer Agent.
 */

import { prisma } from '@/lib/prisma';
import { ContractValidator } from '../../contracts/contract-validator';
import {
  DeploymentRecipeSchema,
  type DeploymentRecipe,
  type DevopsExecutionInput,
  devopsPlanSpecSchema,
  type DevopsPlanSpec,
} from './devops-engineer.types';
import { DevopsEngineerTools } from './devops-engineer.tools';
import type { ApiResult } from '@/types/common.types';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { withRevisionMeta } from '@/core/company-orchestration/revision-feedback';

const DEVOPS_ROLE_NAME = 'DevOps Engineer AI';

async function getOrCreateDevopsAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DEVOPS' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: DEVOPS_ROLE_NAME,
      role: 'DEVOPS',
      status: 'IDLE',
      capabilities: ['CI_CD', 'DOCKER', 'INFRASTRUCTURE'],
    },
  });
  return created.id;
}

export function buildHeuristicDevopsPlan(
  implementation: unknown,
  revisionFeedback?: string,
): DevopsPlanSpec {
  const isStaticHtml = typeof revisionFeedback === 'string' && revisionFeedback.toLowerCase().includes('html');
  
  return withRevisionMeta(
    devopsPlanSpecSchema.parse({
      docker: isStaticHtml 
        ? 'FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]'
        : 'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nCMD ["npm", "start"]',
      dockerCompose: 'version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"',
      cicdPipelines: [
        {
          name: 'Production Deployment pipeline',
          trigger: 'push to main',
          stages: ['lint', 'test', 'build', 'deploy'],
        },
      ],
      githubActions: [
        {
          workflowName: 'ci.yml',
          description: 'Continuous Integration check',
          yamlContent:
            'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - run: npm install\n      - run: npm test',
        },
      ],
      deploymentPlan: [
        {
          step: 1,
          name: 'Environment Setup',
          description: 'Provision cloud resources via Terraform',
          command: 'terraform apply -auto-approve',
        },
        {
          step: 2,
          name: 'Database Migration',
          description: 'Apply Prisma schema changes to production DB',
          command: 'npx prisma migrate deploy',
        },
      ],
      infrastructureDiagram: 'graph TD;\n  User-->LB;\n  LB-->API;\n  API-->DB;',
      environmentVariables: isStaticHtml ? [] : [
        {
          key: 'DATABASE_URL',
          description: 'Primary PostgreSQL connection string',
          required: true,
          isSecret: true,
        },
        {
          key: 'PORT',
          description: 'API listener port',
          required: true,
          isSecret: false,
        },
      ],
      secretsManagement: {
        tool: 'AWS Secrets Manager',
        rotationIntervalDays: 90,
        accessControl: 'Strict IAM role-based access',
      },
      scalingStrategy: {
        minInstances: 2,
        maxInstances: 10,
        targetCpuUtilization: 70,
        autoScalingPolicy: 'Scale out at 70% CPU, scale in at 30% CPU',
      },
      monitoringStrategy: {
        metricsPlatform: 'Datadog',
        keyMetrics: ['Request Latency', 'Error Rate', 'CPU Usage', 'Memory Usage'],
        alertThresholds: ['Error Rate > 1%', 'Latency P99 > 500ms'],
      },
      loggingStrategy: {
        logAggregation: 'Elasticsearch/Kibana',
        retentionDays: 30,
        structuredLogging: true,
      },
      backupDisasterRecovery: {
        schedule: 'Daily at 02:00 UTC',
        retentionDays: 30,
        disasterRecoveryRTO: '4 hours',
        disasterRecoveryRPO: '1 hour',
      },
      rollbackPlan: {
        mechanism: 'Blue/Green deployment flip',
        triggers: ['Failed health checks', 'Elevated error rates post-deploy'],
        maxRollbackTimeSeconds: 120,
      },
      healthChecks: [
        {
          endpoint: '/api/health',
          expectedStatus: 200,
          timeoutSeconds: 5,
        },
      ],
      productionChecklist: [
        { item: 'Ensure HTTPS enforced', verified: false, category: 'security' },
        { item: 'Check load balancer rules', verified: false, category: 'reliability' },
      ],
      status: 'APPROVED',
    }),
    revisionFeedback,
  );
}

export async function generateDevopsPlanSpec(
  projectId: string,
  input: unknown,
  revisionFeedback?: string,
): Promise<ApiResult<DevopsPlanSpec>> {
  const agentId = await getOrCreateDevopsAgentId();
  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DEVOPS_PLAN_STARTED', { projectId }, agentId);

  try {
    const plan = buildHeuristicDevopsPlan(input, revisionFeedback);

    await prisma.document.create({
      data: {
        projectId,
        type: 'DEVOPS_PLAN',
        title: 'DevOps & Release Plan',
        content: JSON.stringify(plan),
      },
    });

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DEVOPS_PLAN_COMPLETED', { projectId }, agentId);

    return { success: true, data: plan };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Devops plan generation failed', code: 'AI_ERROR' },
    };
  }
}

export class DevopsEngineerService {
  public static async prepareDeployment(input: DevopsExecutionInput): Promise<DeploymentRecipe> {
    const dockerfile = await DevopsEngineerTools.generateDockerfile();
    const defaultRecipe: DeploymentRecipe = {
      targetPlatform: 'VERCEL',
      dockerfile,
      environmentVariablesRequired: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
      buildCommands: ['npm ci', 'npx prisma generate', 'npm run build'],
      startCommand: 'npm start',
    };

    const validation = ContractValidator.validate(DeploymentRecipeSchema, defaultRecipe);
    if (!validation.success) {
      throw new Error(`Deployment Recipe validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
