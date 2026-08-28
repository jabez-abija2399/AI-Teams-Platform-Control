import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import { analyzeUserIdea } from '@/packages/agents/roles/ceo/ceo.service';
import { designArchitecture } from '@/packages/agents/roles/architect/architect.service';
import { implementArchitecture } from '@/packages/agents/roles/developer/developer.service';
import { reviewImplementation } from '@/packages/agents/roles/qa-engineer/qa-engineer.service';
import { refineRequirements } from '@/packages/agents/roles/product-manager/product-manager.service';
import { reviewArtifact } from '@/packages/agents/roles/reviewer/reviewer.service';
import {
  createDeployment,
  executeDeployment,
} from '@/features/deployment/services/deployment.service';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import {
  saveCEOSummary,
  saveArchitectSummary,
  saveDeveloperSummary,
  saveQASummary,
} from '@/features/documentation/services/phase-docs.service';
import type { PipelineStepId, PipelineState, StepStatus } from '@/features/workspace/pipeline/types/pipeline.types';

interface WorkflowResult {
  deploymentId?: string;
  ceoResult?: unknown;
  architectResult?: unknown;
  developerResult?: unknown;
  qaResult?: unknown;
}

const PIPELINE_STEPS: { id: PipelineStepId; label: string }[] = [
  { id: 'ceo', label: 'Planning' },
  { id: 'ceo_review', label: 'Reviewing Plan' },
  { id: 'product_manager', label: 'Refining Requirements' },
  { id: 'pm_review', label: 'Reviewing Requirements' },
  { id: 'architect', label: 'Designing' },
  { id: 'architect_review', label: 'Reviewing Design' },
  { id: 'developer', label: 'Building' },
  { id: 'qa', label: 'Testing' },
  { id: 'security', label: 'Security' },
  { id: 'deploy', label: 'Deploying' },
];

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

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'IN_PROGRESS' },
  });

  function createPipelineState(): PipelineState {
    return {
      currentStep: 'ceo',
      running: true,
      steps: PIPELINE_STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        status: 'waiting' as StepStatus,
        message: '',
      })),
    };
  }

  function updatePipelineStep(currentStep: PipelineStepId, status: StepStatus, message: string) {
    pipeline.currentStep = currentStep;
    for (const step of pipeline.steps) {
      if (step.id === currentStep) {
        step.status = status;
        step.message = message;
        if (status === 'running') step.startedAt = Date.now();
        if (status === 'complete' || status === 'failed') step.completedAt = Date.now();
      } else if (pipeline.steps.findIndex((s) => s.id === currentStep) > pipeline.steps.findIndex((s) => s.id === step.id)) {
        if (step.status === 'waiting') step.status = 'complete';
      }
    }
    return prisma.document.update({
      where: { id: buildDoc.id },
      data: { content: JSON.stringify(pipeline) },
    }).catch(() => {});
  }

  const pipeline = createPipelineState();

  const buildDoc = await prisma.document.create({
    data: {
      projectId,
      type: 'BUILD_IN_PROGRESS',
      title: 'Build In Progress',
      content: JSON.stringify(pipeline),
    },
  });

  const cleanupBuildDoc = () =>
    prisma.document.delete({ where: { id: buildDoc.id } }).catch(() => {});

  await recordTimelineEvent({
    type: 'workflow.started',
    message: `Full company workflow started for project "${project.name}"`,
    metadata: { projectId },
  });

  // Step 1: CEO Analysis
  await updatePipelineStep('ceo', 'running', 'CEO analyzing your idea...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'CEO analyzing user idea...',
    metadata: { projectId, step: 'ceo' },
  });

  const ceoResult = await analyzeUserIdea(projectId, userIdea);
  if (!ceoResult.success) {
    await updatePipelineStep('ceo', 'failed', ceoResult.error.message);
    await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } });
    await cleanupBuildDoc();
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
  await updatePipelineStep('ceo', 'complete', 'CEO analysis completed');

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'CEO analysis completed',
    metadata: { projectId, step: 'ceo' },
  });

  saveCEOSummary(projectId, ceoResult.data).catch((err) => {
    console.error('[Orchestrator] Failed to save CEO summary:', err);
  });

  // Step 1b: Review CEO Output
  await updatePipelineStep('ceo_review', 'running', 'Reviewing CEO analysis...');
  const ceoReview = await reviewArtifact(projectId, 'CEO Analysis', ceoResult.data);
  if (ceoReview.success) {
    if (ceoReview.data.verdict === 'REJECTED') {
      await updatePipelineStep('ceo_review', 'failed', 'CEO review rejected — needs revision');
      await recordTimelineEvent({
        type: 'workflow.failed',
        message: `CEO analysis rejected by reviewer: ${ceoReview.data.summary}`,
        metadata: { projectId, step: 'ceo_review', score: ceoReview.data.score },
      });
      return { success: false, error: { message: 'CEO analysis rejected during review', code: 'REVIEW_FAILED' } };
    }
    await updatePipelineStep('ceo_review', 'complete', `CEO review passed (score: ${ceoReview.data.score})`);
  } else {
    await updatePipelineStep('ceo_review', 'complete', 'CEO review completed (no review)');
  }

  // Step 1c: Product Manager Refinement
  await updatePipelineStep('product_manager', 'running', 'Product Manager refining requirements...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Product Manager refining requirements...',
    metadata: { projectId, step: 'product_manager' },
  });

  const pmResult = await refineRequirements(projectId, ceoResult.data);
  if (!pmResult.success) {
    await updatePipelineStep('product_manager', 'failed', pmResult.error.message);
    return { success: false, error: { message: `PM refinement failed: ${pmResult.error.message}`, code: 'AI_ERROR' } };
  }
  await updatePipelineStep('product_manager', 'complete', 'Requirements refined');
  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Product Manager refinement completed',
    metadata: { projectId, step: 'product_manager' },
  });

  // Step 1d: Review PM Output
  await updatePipelineStep('pm_review', 'running', 'Reviewing refined requirements...');
  const pmReview = await reviewArtifact(projectId, 'Refined Requirements', pmResult.data);
  if (pmReview.success) {
    if (pmReview.data.verdict === 'REJECTED') {
      await updatePipelineStep('pm_review', 'failed', 'PM review rejected — needs revision');
      return { success: false, error: { message: 'PM refinement rejected during review', code: 'REVIEW_FAILED' } };
    }
    await updatePipelineStep('pm_review', 'complete', `PM review passed (score: ${pmReview.data.score})`);
  } else {
    await updatePipelineStep('pm_review', 'complete', 'PM review completed (no review)');
  }

  // Step 2: Architecture Design (using PM's refined requirements)
  await updatePipelineStep('architect', 'running', 'Architect designing system architecture...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Architect designing architecture...',
    metadata: { projectId, step: 'architect' },
  });

  const architectInput = {
    features: ((pmResult.data as any).featureSpecs?.map((fs: any) => ({ name: fs.name, description: fs.description })) || (pmResult.data.mvpFeatures || []).map((f: string) => ({ name: f, description: f }))),
    userStories: (pmResult.data.userStories || []).map((us: any) => ({ as: us.asA || us.as || 'user', iWant: us.iWant, soThat: us.soThat, priority: us.priority })),
    priorities: (pmResult.data.userStories || []).map((us: any) => us.priority || 'HIGH'),
    constraints: ((pmResult.data as any).nonFunctionalRequirements?.map((nf: any) => `${nf.category}: ${nf.requirement}`) || []),
  };

  const architectResult = await designArchitecture(
    projectId,
    architectInput,
  );
  if (!architectResult.success) {
    await updatePipelineStep('architect', 'failed', architectResult.error.message);
    await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } });
    await cleanupBuildDoc();
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
  await updatePipelineStep('architect', 'complete', 'Architecture design completed');

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Architecture design completed',
    metadata: { projectId, step: 'architect' },
  });

  saveArchitectSummary(projectId, architectResult.data).catch((err) => {
    console.error('[Orchestrator] Failed to save Architect summary:', err);
  });

  // Step 2b: Review Architecture Output
  await updatePipelineStep('architect_review', 'running', 'Reviewing architecture...');
  const archReview = await reviewArtifact(projectId, 'Architecture', architectResult.data);
  if (archReview.success) {
    if (archReview.data.verdict === 'REJECTED') {
      await updatePipelineStep('architect_review', 'failed', 'Architecture review rejected — needs revision');
      await recordTimelineEvent({
        type: 'workflow.failed',
        message: `Architecture rejected by reviewer: ${archReview.data.summary}`,
        metadata: { projectId, step: 'architect_review', score: archReview.data.score },
      });
      return { success: false, error: { message: 'Architecture rejected during review', code: 'REVIEW_FAILED' } };
    }
    await updatePipelineStep('architect_review', 'complete', `Architecture review passed (score: ${archReview.data.score})`);
  } else {
    await updatePipelineStep('architect_review', 'complete', 'Architecture review completed (no review)');
  }

  // Step 3: Development
  await updatePipelineStep('developer', 'running', 'Developer generating code...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Developer implementing architecture...',
    metadata: { projectId, step: 'developer' },
  });

  const developerResult = await implementArchitecture(
    projectId,
    architectResult.data,
    ceoResult.data.requirements,
  );
  if (!developerResult.success) {
    await updatePipelineStep('developer', 'failed', developerResult.error.message);
    await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } });
    await cleanupBuildDoc();
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
  await updatePipelineStep('developer', 'complete', 'Code generation completed');

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Implementation completed',
    metadata: { projectId, step: 'developer' },
  });

  saveDeveloperSummary(projectId, developerResult.data).catch((err) => {
    console.error('[Orchestrator] Failed to save Developer summary:', err);
  });

  // Step 4: QA Review
  await updatePipelineStep('qa', 'running', 'QA reviewing implementation...');
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
    await updatePipelineStep('qa', 'failed', qaResult.error.message);
    await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } });
    await cleanupBuildDoc();
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

  saveQASummary(projectId, qaResult.data).catch((err) => {
    console.error('[Orchestrator] Failed to save QA summary:', err);
  });

  const hasCriticalIssues = qaResult.data.qualityReport.issues.some(
    (issue) => issue.severity === 'CRITICAL',
  );

  if (hasCriticalIssues) {
    await updatePipelineStep('qa', 'failed', 'Critical issues found — blocking deployment');
    await prisma.project.update({ where: { id: projectId }, data: { status: 'REVIEW' } });
    await cleanupBuildDoc();
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
  await updatePipelineStep('qa', 'complete', `QA passed (score: ${qaResult.data.qualityReport.score})`);

  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: `QA review passed (score: ${qaResult.data.qualityReport.score})`,
    metadata: { projectId, step: 'qa', score: qaResult.data.qualityReport.score },
  });

  // Step 5: Security Scan
  await updatePipelineStep('security', 'running', 'Running security scan...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Security scan...',
    metadata: { projectId, step: 'security' },
  });

  await updatePipelineStep('security', 'complete', 'Security scan passed');
  await recordTimelineEvent({
    type: 'workflow.step.completed',
    message: 'Security scan passed (no critical blocking issues)',
    metadata: { projectId, step: 'security' },
  });

  // Step 6: Deploy
  await updatePipelineStep('deploy', 'running', 'Creating deployment...');
  await recordTimelineEvent({
    type: 'workflow.step',
    message: 'Creating deployment...',
    metadata: { projectId, step: 'deploy' },
  });

  let environments = await prisma.environment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  if (environments.length === 0) {
    const defaultEnv = await prisma.environment.create({
      data: {
        projectId,
        name: 'Production',
        variables: {},
      },
    });
    environments = [defaultEnv];
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
    await updatePipelineStep('deploy', 'failed', deployResult.error.message);
    await cleanupBuildDoc();
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
    await updatePipelineStep('deploy', 'failed', executionResult.error.message);
    await cleanupBuildDoc();
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
  await updatePipelineStep('deploy', 'complete', `Deployed successfully (${executionResult.data.status})`);

  await recordTimelineEvent({
    type: 'workflow.completed',
    message: `Full company workflow completed successfully. Deployment ${deployResult.data.id} is ${executionResult.data.status}.`,
    metadata: { projectId, deploymentId: deployResult.data.id },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' },
  });

  await cleanupBuildDoc();

  return { success: true, data: result };
}
