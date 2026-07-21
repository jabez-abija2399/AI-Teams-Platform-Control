import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { DeploymentInfo, DeploymentStepInfo, DeploymentLogEntry, DeployInput } from '@/features/deployment/types';
import {
  createDeploymentSchema,
  deploymentFilterSchema,
  type DeploymentFilter,
} from '@/features/deployment/schemas/deployment.schema';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';

function toDeploymentInfo(
  deployment: {
    id: string;
    projectId: string;
    environmentId: string;
    provider: string;
    status: string;
    releaseId: string | null;
    createdAt: Date;
    updatedAt: Date;
    environment: { name: string };
    steps: unknown[];
  },
): DeploymentInfo {
  const completedSteps = deployment.steps.filter(
    (s) => (s as { status: string }).status === 'SUCCESS',
  ).length;

  return {
    id: deployment.id,
    projectId: deployment.projectId,
    environmentId: deployment.environmentId,
    environmentName: deployment.environment.name,
    provider: deployment.provider,
    status: deployment.status,
    releaseId: deployment.releaseId,
    createdAt: deployment.createdAt,
    updatedAt: deployment.updatedAt,
    stepCount: deployment.steps.length,
    completedSteps,
  };
}

function toDeploymentStepInfo(
  step: {
    id: string;
    deploymentId: string;
    name: string;
    status: string;
    logs: string;
    createdAt: Date;
  },
): DeploymentStepInfo {
  return {
    id: step.id,
    deploymentId: step.deploymentId,
    name: step.name,
    status: step.status,
    logs: step.logs,
    createdAt: step.createdAt,
  };
}

function toDeploymentLogEntry(
  log: {
    id: string;
    deploymentId: string;
    type: string;
    message: string;
    timestamp: Date;
  },
): DeploymentLogEntry {
  return {
    id: log.id,
    deploymentId: log.deploymentId,
    type: log.type,
    message: log.message,
    timestamp: log.timestamp,
  };
}

export async function createDeployment(
  input: DeployInput,
): Promise<ApiResult<DeploymentInfo>> {
  const parsed = createDeploymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid deployment data',
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const environment = await prisma.environment.findFirst({
    where: { id: parsed.data.environmentId },
  });
  if (!environment) {
    return {
      success: false,
      error: { message: 'Environment not found', code: 'NOT_FOUND' },
    };
  }

  if (parsed.data.releaseId) {
    const release = await prisma.release.findFirst({ where: { id: parsed.data.releaseId } });
    if (!release) {
      return {
        success: false,
        error: { message: 'Release not found', code: 'NOT_FOUND' },
      };
    }
  }

  const deployment = await prisma.deployment.create({
    data: {
      projectId: parsed.data.projectId,
      environmentId: parsed.data.environmentId,
      provider: parsed.data.provider,
      releaseId: parsed.data.releaseId ?? null,
      steps: {
        create: parsed.data.steps.map((step) => ({ name: step.name })),
      },
    },
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
  });

  await recordTimelineEvent({
    type: 'deployment.created',
    message: `Deployment created for ${environment.name} using ${parsed.data.provider}`,
    metadata: { deploymentId: deployment.id, projectId: parsed.data.projectId },
  });

  return { success: true, data: toDeploymentInfo(deployment) };
}

export async function getDeployment(
  deploymentId: string,
): Promise<ApiResult<DeploymentInfo>> {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId },
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
  });

  if (!deployment) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  return { success: true, data: toDeploymentInfo(deployment) };
}

export async function listDeployments(
  projectId: string,
  filter?: DeploymentFilter,
): Promise<ApiResult<DeploymentInfo[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const parsedFilter = filter ? deploymentFilterSchema.safeParse(filter) : undefined;
  const where: Record<string, unknown> = { projectId };
  if (parsedFilter?.success) {
    if (parsedFilter.data.environmentId) where.environmentId = parsedFilter.data.environmentId;
    if (parsedFilter.data.status) where.status = parsedFilter.data.status;
  }

  const deployments = await prisma.deployment.findMany({
    where,
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: deployments.map(toDeploymentInfo) };
}

export async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
): Promise<ApiResult<DeploymentInfo>> {
  const existing = await prisma.deployment.findFirst({ where: { id: deploymentId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  const deployment = await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status },
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
  });

  return { success: true, data: toDeploymentInfo(deployment) };
}

export async function addDeploymentLog(
  deploymentId: string,
  type: string,
  message: string,
): Promise<ApiResult<DeploymentLogEntry>> {
  const existing = await prisma.deployment.findFirst({ where: { id: deploymentId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  const log = await prisma.deploymentLog.create({
    data: { deploymentId, type, message },
  });

  return { success: true, data: toDeploymentLogEntry(log) };
}

export async function getDeploymentLogs(
  deploymentId: string,
): Promise<ApiResult<DeploymentLogEntry[]>> {
  const existing = await prisma.deployment.findFirst({ where: { id: deploymentId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  const logs = await prisma.deploymentLog.findMany({
    where: { deploymentId },
    orderBy: { timestamp: 'asc' },
  });

  return { success: true, data: logs.map(toDeploymentLogEntry) };
}

export async function getDeploymentSteps(
  deploymentId: string,
): Promise<ApiResult<DeploymentStepInfo[]>> {
  const existing = await prisma.deployment.findFirst({ where: { id: deploymentId } });
  if (!existing) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  const steps = await prisma.deploymentStep.findMany({
    where: { deploymentId },
    orderBy: { createdAt: 'asc' },
  });

  return { success: true, data: steps.map(toDeploymentStepInfo) };
}

export async function executeDeployment(
  deploymentId: string,
): Promise<ApiResult<DeploymentInfo>> {
  const deployment = await prisma.deployment.findFirst({
    where: { id: deploymentId },
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
  });

  if (!deployment) {
    return {
      success: false,
      error: { message: 'Deployment not found', code: 'NOT_FOUND' },
    };
  }

  if (deployment.status !== 'PENDING') {
    return {
      success: false,
      error: { message: 'Deployment is not in PENDING status', code: 'INVALID_STATE' },
    };
  }

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'RUNNING' },
  });

  await prisma.deploymentLog.create({
    data: {
      deploymentId,
      type: 'INFO',
      message: `Deployment started on ${deployment.environment.name} using ${deployment.provider}`,
    },
  });

  await recordTimelineEvent({
    type: 'deployment.started',
    message: `Deployment started for ${deployment.environment.name}`,
    metadata: { deploymentId, projectId: deployment.projectId },
  });

  let allSucceeded = true;

  for (const step of deployment.steps) {
    await prisma.deploymentStep.update({
      where: { id: step.id },
      data: { status: 'RUNNING' },
    });

    await prisma.deploymentLog.create({
      data: {
        deploymentId,
        type: 'STEP',
        message: `Step "${step.name}" started`,
      },
    });

    const duration = 500 + Math.floor(Math.random() * 2000);
    await new Promise((resolve) => setTimeout(resolve, Math.min(duration, 300)));

    const succeeded = Math.random() > 0.15;

    if (succeeded) {
      const stepLogs = `Step "${step.name}" completed successfully in ${duration}ms.`;
      await prisma.deploymentStep.update({
        where: { id: step.id },
        data: { status: 'SUCCESS', logs: stepLogs },
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId,
          type: 'STEP',
          message: `Step "${step.name}" completed successfully`,
        },
      });
    } else {
      allSucceeded = false;
      const errorLogs = `Step "${step.name}" failed: Simulated error during execution.`;
      await prisma.deploymentStep.update({
        where: { id: step.id },
        data: { status: 'FAILED', logs: errorLogs },
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId,
          type: 'ERROR',
          message: `Step "${step.name}" failed`,
        },
      });

      break;
    }
  }

  const finalStatus = allSucceeded ? 'SUCCESS' : 'FAILED';

  await prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: finalStatus },
  });

  await prisma.deploymentLog.create({
    data: {
      deploymentId,
      type: allSucceeded ? 'INFO' : 'ERROR',
      message: allSucceeded
        ? 'Deployment completed successfully'
        : 'Deployment failed',
    },
  });

  await recordTimelineEvent({
    type: allSucceeded ? 'deployment.completed' : 'deployment.failed',
    message: allSucceeded
      ? `Deployment to ${deployment.environment.name} succeeded`
      : `Deployment to ${deployment.environment.name} failed`,
    metadata: { deploymentId, projectId: deployment.projectId },
  });

  const updated = await prisma.deployment.findFirst({
    where: { id: deploymentId },
    include: {
      environment: { select: { name: true } },
      steps: true,
    },
  });

  return { success: true, data: toDeploymentInfo(updated!) };
}
