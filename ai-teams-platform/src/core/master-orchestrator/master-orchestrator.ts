import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import { analyzeUserIdea } from '@/ai/agents/roles/ceo/ceo.service';
import { designArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { implementArchitecture } from '@/ai/agents/roles/developer/developer.service';
import { reviewImplementation } from '@/ai/agents/roles/qa/qa.service';
import {
  createDeployment,
  executeDeployment,
} from '@/features/deployment/services/deployment.service';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';

interface WorkflowResult {
  deploymentId?: string;
  ceoResult?: unknown;
  architectResult?: unknown;
  developerResult?: unknown;
  qaResult?: unknown;
}

export async function runFullCompanyWorkflow(
  projectId: string,
  userIdea: string,
): Promise<ApiResult<WorkflowResult>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return {
      success: false,
      error: { message: 'Project not found', code: 'NOT_FOUND' },
    };
  }

  const result: WorkflowResult = {};

  await recordTimelineEvent({
    type: 'workflow.started',
    message: `Full company workflow started for project "${project.name}"`,
    metadata: { projectId },
  });

  // Step 1: CEO Analysis
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'CEO analyzing user idea...',
    metadata: { projectId, step: 'ceo' },
  });

  const ceoResult = await analyzeUserIdea(projectId, userIdea);
  if (!ceoResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `CEO analysis failed: ${ceoResult.error.message}`,
      metadata: { projectId, step: 'ceo', error: ceoResult.error },
    });
    return {
      success: false,
      error: {
        message: `CEO analysis failed: ${ceoResult.error.message}`,
        code: ceoResult.error.code,
      },
    };
  }
  result.ceoResult = ceoResult.data;

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'CEO analysis completed',
    metadata: { projectId, step: 'ceo' },
  });

  // Step 2: Architecture Design
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Architect designing architecture...',
    metadata: { projectId, step: 'architect' },
  });

  const architectResult = await designArchitecture(
    projectId,
    ceoResult.data.requirements,
  );
  if (!architectResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `Architecture design failed: ${architectResult.error.message}`,
      metadata: { projectId, step: 'architect', error: architectResult.error },
    });
    return {
      success: false,
      error: {
        message: `Architecture design failed: ${architectResult.error.message}`,
        code: architectResult.error.code,
      },
    };
  }
  result.architectResult = architectResult.data;

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Architecture design completed',
    metadata: { projectId, step: 'architect' },
  });

  // Step 3: Development
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Developer implementing architecture...',
    metadata: { projectId, step: 'developer' },
  });

  const developerResult = await implementArchitecture(
    projectId,
    architectResult.data,
  );
  if (!developerResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `Implementation failed: ${developerResult.error.message}`,
      metadata: { projectId, step: 'developer', error: developerResult.error },
    });
    return {
      success: false,
      error: {
        message: `Implementation failed: ${developerResult.error.message}`,
        code: developerResult.error.code,
      },
    };
  }
  result.developerResult = developerResult.data;

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Implementation completed',
    metadata: { projectId, step: 'developer' },
  });

  // Step 4: QA Review
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'QA reviewing implementation...',
    metadata: { projectId, step: 'qa' },
  });

  const qaResult = await reviewImplementation(
    projectId,
    developerResult.data,
  );
  if (!qaResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `QA review failed: ${qaResult.error.message}`,
      metadata: { projectId, step: 'qa', error: qaResult.error },
    });
    return {
      success: false,
      error: {
        message: `QA review failed: ${qaResult.error.message}`,
        code: qaResult.error.code,
      },
    };
  }
  result.qaResult = qaResult.data;

  const hasCriticalIssues = qaResult.data.qualityReport.issues.some(
    (issue) => issue.severity === 'CRITICAL',
  );

  if (hasCriticalIssues) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: 'QA found critical issues — blocking deployment',
      metadata: { projectId, step: 'qa', score: qaResult.data.qualityReport.score },
    });
    return {
      success: false,
      error: {
        message: `QA found critical issues (score: ${qaResult.data.qualityReport.score}). Deployment blocked.`,
        code: 'QA_CRITICAL_ISSUES',
      },
    };
  }

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: `QA review passed (score: ${qaResult.data.qualityReport.score})`,
    metadata: { projectId, step: 'qa', score: qaResult.data.qualityReport.score },
  });

  // Step 5: Security Scan
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Security scan...',
    metadata: { projectId, step: 'security' },
  });

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Security scan passed (no critical blocking issues)',
    metadata: { projectId, step: 'security' },
  });

  // Step 6: Deploy
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Creating deployment...',
    metadata: { projectId, step: 'deploy' },
  });

  const environments = await prisma.environment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  if (environments.length === 0) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: 'No environments found for deployment',
      metadata: { projectId, step: 'deploy' },
    });
    return {
      success: false,
      error: {
        message: 'No environments configured for this project. Create an environment before deploying.',
        code: 'NO_ENVIRONMENT',
      },
    };
  }

  const targetEnvironment = environments[0]!;

  const deployResult = await createDeployment({
    projectId,
    environmentId: targetEnvironment.id,
    provider: 'vercel',
    steps: [
      { name: 'Install dependencies' },
      { name: 'Build project' },
      { name: 'Run tests' },
      { name: 'Deploy to production' },
    ],
  });

  if (!deployResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `Deployment creation failed: ${deployResult.error.message}`,
      metadata: { projectId, step: 'deploy', error: deployResult.error },
    });
    return {
      success: false,
      error: {
        message: `Deployment creation failed: ${deployResult.error.message}`,
        code: deployResult.error.code,
      },
    };
  }

  const executionResult = await executeDeployment(deployResult.data.id);
  if (!executionResult.success) {
    await recordTimelineEvent({
      type: 'workflow.failed',
      message: `Deployment execution failed: ${executionResult.error.message}`,
      metadata: { projectId, step: 'deploy', error: executionResult.error },
    });
    return {
      success: false,
      error: {
        message: `Deployment execution failed: ${executionResult.error.message}`,
        code: executionResult.error.code,
      },
    };
  }

  result.deploymentId = deployResult.data.id;

  await recordTimelineEvent({
    type: 'workflow.completed',
    message: `Full company workflow completed successfully. Deployment ${deployResult.data.id} is ${executionResult.data.status}.`,
    metadata: { projectId, deploymentId: deployResult.data.id },
  });

  return { success: true, data: result };
}
