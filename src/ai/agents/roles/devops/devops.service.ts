import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { devopsConfig } from './devops.config';
import { DEVOPS_SYSTEM_PROMPT } from './devops.prompt';
import {
  devopsPlanSpecSchema,
  type DevopsPlanSpec,
} from './devops.types';
import { withRevisionMeta } from '@/core/company-orchestration/revision-feedback';
import { resolveStackIntent } from '@/core/company-orchestration/stack-intent';
import type { ApiResult } from '@/types/common.types';

const DEVOPS_ROLE_NAME = 'DevOps Engineer';

async function getOrCreateDevopsAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DEVOPS' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: DEVOPS_ROLE_NAME,
      role: 'DEVOPS',
      status: 'IDLE',
      capabilities: ['DEVOPS', 'CODE_REVIEW', 'BUG_FIXING', 'DOCUMENTATION'],
    },
  });
  return created.id;
}

/**
 * Lean preview / release package for Mission Control.
 * Avoids multi-minute LLM hangs that stall Preview at 94%.
 */
export function buildHeuristicDevopsPlan(
  _input?: unknown,
  feedback?: string,
): DevopsPlanSpec {
  const intent = resolveStackIntent(_input, feedback);

  if (intent.staticNoBackend || intent.htmlCss) {
    return withRevisionMeta(
      devopsPlanSpecSchema.parse({
        docker:
          'FROM nginx:alpine\nCOPY . /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx","-g","daemon off;"]',
        dockerCompose:
          'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"\n    volumes:\n      - ./:/usr/share/nginx/html:ro',
        cicdPipelines: [
          {
            name: 'Static Preview',
            trigger: 'manual / workflow_dispatch',
            stages: ['validate-html', 'publish-static-preview'],
          },
        ],
        githubActions: [
          {
            workflowName: 'static-preview.yml',
            description: 'Validate static HTML — deploy only when user clicks Deploy',
            yamlContent:
              'name: Static Preview\non:\n  workflow_dispatch:\njobs:\n  preview:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: test -f index.html -o -f login.html',
          },
        ],
        deploymentPlan: [
          {
            step: 1,
            name: 'Open static preview',
            description: 'Serve the folder or open index.html / login.html.',
            command: 'python3 -m http.server 8080',
          },
          {
            step: 2,
            name: 'Smoke checks',
            description: 'Confirm login.html and css/styles.css load.',
            command: 'curl -f http://localhost:8080/login.html',
          },
          {
            step: 3,
            name: 'Deploy (user-triggered)',
            description: 'Upload static files only after explicit Deploy.',
            command: 'deploy --static',
          },
        ],
        infrastructureDiagram:
          'Browser → Static HTML/CSS host (no Node app server) → Optional CDN',
        environmentVariables: [],
        secretsStrategy: {
          tool: 'None required for static demo',
          rotationIntervalDays: 365,
          accessControl: 'n/a',
        },
        scalingPlan: {
          minInstances: 1,
          maxInstances: 1,
          targetCpuUtilization: 50,
          autoScalingPolicy: 'CDN / static host only',
        },
        monitoringPlan: {
          metricsPlatform: 'Host uptime',
          keyMetrics: ['availability'],
          alertThresholds: ['host down'],
        },
        loggingPlan: {
          logAggregation: 'Host access logs',
          retentionDays: 7,
          structuredLogging: false,
        },
        backupPlan: {
          schedule: 'Git commits',
          retentionDays: 90,
          disasterRecoveryRTO: '1 hour',
          disasterRecoveryRPO: 'last commit',
        },
        rollbackStrategy: {
          mechanism: 'Redeploy previous git commit of HTML/CSS',
          triggers: ['Broken markup', 'Missing assets'],
          maxRollbackTimeSeconds: 60,
        },
        healthChecks: [
          { endpoint: '/index.html', type: 'liveness', intervalSeconds: 60, timeoutSeconds: 3 },
          { endpoint: '/login.html', type: 'liveness', intervalSeconds: 60, timeoutSeconds: 3 },
        ],
        productionChecklist: [
          { item: 'index.html or login.html present', verified: false, category: 'reliability' },
          { item: 'css/styles.css linked', verified: false, category: 'reliability' },
          { item: 'No secrets in HTML', verified: false, category: 'security' },
          { item: 'Deploy only after user clicks Deploy', verified: false, category: 'reliability' },
        ],
        status: 'PREVIEW_READY',
      }),
      feedback,
    );
  }

  return withRevisionMeta(
    devopsPlanSpecSchema.parse({
      docker:
        'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["npm","start"]',
      dockerCompose:
        'services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_PASSWORD: change-me',
      cicdPipelines: [
        {
          name: 'CI',
          trigger: 'push / pull_request',
          stages: ['lint', 'test', 'build'],
        },
        {
          name: 'Preview',
          trigger: 'manual / after security approval',
          stages: ['build', 'publish-preview', 'smoke-test'],
        },
      ],
      githubActions: [
        {
          workflowName: 'preview.yml',
          description: 'Build preview artifact — deploy only when user clicks Deploy',
          yamlContent:
            'name: Preview\non:\n  workflow_dispatch:\njobs:\n  preview:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm run build',
        },
      ],
      deploymentPlan: [
        {
          step: 1,
          name: 'Open preview',
          description: 'Review the sandbox / preview URL before any production deploy.',
          command: 'npm run build && npm run start',
        },
        {
          step: 2,
          name: 'Smoke checks',
          description: 'Hit /api/health and critical auth pages.',
          command: 'curl -f http://localhost:3000/api/health',
        },
        {
          step: 3,
          name: 'Deploy (user-triggered)',
          description: 'Only after explicit Deploy in Mission Control.',
          command: 'deploy --env production',
        },
      ],
      infrastructureDiagram:
        'Preview sandbox → User review → Optional production deploy → Monitoring',
      environmentVariables: [
        { key: 'DATABASE_URL', description: 'Postgres connection', required: true, isSecret: true },
        { key: 'NEXTAUTH_SECRET', description: 'Auth secret', required: true, isSecret: true },
        { key: 'NODE_ENV', description: 'production | preview', required: true, isSecret: false },
      ],
      healthChecks: [
        { endpoint: '/api/health', type: 'liveness', intervalSeconds: 15, timeoutSeconds: 3 },
      ],
      productionChecklist: [
        { item: 'Preview reviewed by owner', verified: false, category: 'reliability' },
        { item: 'Secrets set in target environment', verified: false, category: 'security' },
        { item: 'Health check green', verified: false, category: 'monitoring' },
        { item: 'Explicit Deploy clicked (not auto)', verified: false, category: 'reliability' },
      ],
      status: 'PREVIEW_READY',
    }),
    feedback,
  );
}

async function persistPlan(
  projectId: string,
  agentId: string,
  spec: DevopsPlanSpec,
): Promise<string> {
  const savedDoc = await prisma.devopsPlanDocument.create({
    data: {
      projectId,
      docker: spec.docker,
      dockerCompose: spec.dockerCompose,
      cicdPipelines: spec.cicdPipelines as any,
      githubActions: spec.githubActions as any,
      deploymentPlan: spec.deploymentPlan as any,
      infrastructureDiagram: spec.infrastructureDiagram,
      environmentVariables: spec.environmentVariables as any,
      secretsStrategy: spec.secretsStrategy as any,
      scalingPlan: spec.scalingPlan as any,
      monitoringPlan: spec.monitoringPlan as any,
      loggingPlan: spec.loggingPlan as any,
      backupPlan: spec.backupPlan as any,
      rollbackStrategy: spec.rollbackStrategy as any,
      healthChecks: spec.healthChecks as any,
      productionChecklist: spec.productionChecklist as any,
      status: spec.status,
    },
  });

  const memory = getMemoryManager();
  await prisma.document.create({
    data: {
      projectId,
      type: 'DEVOPS_PLAN',
      title: 'Preview & release package',
      content: JSON.stringify(spec),
      author: DEVOPS_ROLE_NAME,
    },
  });
  await memory.remember({
    agentId,
    content: `Project ${projectId}: Preview package ready (deploy is user-triggered).`,
    type: 'PROJECT',
    metadata: { projectId, docId: savedDoc.id },
  });

  return savedDoc.id;
}

export async function generateDevopsPlanSpec(
  projectId: string,
  inputData: unknown,
  feedback?: string,
): Promise<ApiResult<DevopsPlanSpec>> {
  const agentId = await getOrCreateDevopsAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DEVOPS_PLAN_STARTED', { projectId }, agentId);

  try {
    // Always return a lean preview package immediately (Mission Control reliability).
    const spec = buildHeuristicDevopsPlan(inputData, feedback);
    const docId = await persistPlan(projectId, agentId, spec);

    // Optional background LLM enrichment — never blocks the pipeline
    if (!feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `Input (truncated):\n${JSON.stringify(inputData, null, 2).slice(0, 4000)}\n\nGenerate lean DevOps JSON for preview-first deploy. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(prompt, DEVOPS_SYSTEM_PROMPT, 'DEVOPS', devopsConfig, projectId, agentId),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('DevOps LLM budget exceeded')), 20_000),
            ),
          ]);
          const parsed = devopsPlanSpecSchema.safeParse(raw);
          if (parsed.success) {
            await persistPlan(projectId, agentId, {
              ...parsed.data,
              status: 'PREVIEW_READY',
            });
          }
        } catch {
          /* optional */
        }
      })();
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DEVOPS_PLAN_COMPLETED', { projectId, docId }, agentId);
    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicDevopsPlan(inputData, feedback);
      await persistPlan(projectId, agentId, fallback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('DEVOPS_PLAN_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : 'DevOps plan generation failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
