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

export async function generateDevopsPlanSpec(
  projectId: string,
  inputData: unknown,
): Promise<ApiResult<DevopsPlanSpec>> {
  const agentId = await getOrCreateDevopsAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DEVOPS_PLAN_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Architecture, Security, and Engineering Specs:\n${JSON.stringify(inputData, null, 2)}\n\nGenerate comprehensive DevOps & Infrastructure Plan (Docker, Docker Compose, CI/CD Pipelines, GitHub Actions, Deployment Plan, Diagram, Env Vars, Secrets Strategy, Scaling, Monitoring, Logging, Backups, Rollback, Health Checks, Checklist). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      DEVOPS_SYSTEM_PROMPT,
      'DEVOPS',
      devopsConfig,
      projectId,
      agentId,
    );

    const spec = devopsPlanSpecSchema.parse(raw);

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

    const existingArch = await prisma.architectureDocument.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingArch) {
      const currentArch = typeof existingArch.architecture === 'object' && existingArch.architecture ? existingArch.architecture : {};
      await prisma.architectureDocument.update({
        where: { id: existingArch.id },
        data: {
          architecture: {
            ...currentArch,
            devopsPlan: spec as any,
          } as any,
        },
      });
    }

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'DEVOPS_PLAN',
          title: `DevOps & Infrastructure Deployment Plan`,
          content: JSON.stringify(spec),
          author: DEVOPS_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated DevOps Plan with ${spec.cicdPipelines.length} CI/CD pipelines and ${spec.githubActions.length} GitHub workflows.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DEVOPS_PLAN_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('DEVOPS_PLAN_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'DevOps plan generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
