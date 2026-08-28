import type { ApiResult } from '@/types/common.types';
import type { PipelineConfig } from './integration.types';
import { companyEventBus } from './event-bus';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionStateService } from './execution-state.service';
import { analyzeUserIdea } from '@/packages/agents/roles/ceo/ceo.service';
import { refineRequirements } from '@/packages/agents/roles/product-manager/product-manager.service';
import { designArchitecture } from '@/packages/agents/roles/architect/architect.service';
import { implementArchitecture } from '@/packages/agents/roles/developer/developer.service';
import { reviewImplementation } from '@/packages/agents/roles/qa-engineer/qa-engineer.service';
import { reviewArtifact } from '@/packages/agents/roles/reviewer/reviewer.service';
import {
  saveCEOSummary,
  saveArchitectSummary,
  saveDeveloperSummary,
  saveQASummary,
} from '@/features/documentation/services/phase-docs.service';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import { AIRuntimeEngine } from '@/core/runtime/ai-runtime.engine';
import { prisma } from '@/lib/prisma';

export class CompanyOrchestrator {
  public static async executeDiscovery(projectId: string, userIdea: string): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      if (state.currentPhase === 'CREATED' || state.currentPhase === 'FAILED' || state.currentPhase === 'PAUSED') {
        await LifecycleManager.transition(projectId, state.currentPhase, 'DISCOVERY', 'Starting discovery stage');
        ExecutionStateService.updatePhase(projectId, 'DISCOVERY');
      }

      ExecutionStateService.addActiveAgent(projectId, 'CEO');
      ExecutionStateService.setMilestoneAndTask(projectId, 'Product Discovery', 'Analyzing user idea');
      await companyEventBus.publish('TASK_STARTED', projectId, { task: 'analyzeUserIdea', role: 'CEO' }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step', message: 'CEO analyzing user idea...', metadata: { projectId, step: 'discovery' } });

      const ceoResult = await analyzeUserIdea(projectId, userIdea);
      if (!ceoResult.success) {
        throw new Error(ceoResult.error.message);
      }

      // Review CEO output
      const review = await reviewArtifact(projectId, 'CEO Analysis', ceoResult.data);
      if (review.success && review.data.verdict === 'REJECTED') {
        throw new Error(`CEO analysis rejected by review committee: ${review.data.summary}`);
      }

      await saveCEOSummary(projectId, ceoResult.data).catch(() => {});
      ExecutionStateService.removeActiveAgent(projectId, 'CEO');
      ExecutionStateService.completeTask(projectId, 'analyzeUserIdea', 'CEO');

      await companyEventBus.publish('DISCOVERY_COMPLETED', projectId, { ceoResult: ceoResult.data }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step.completed', message: 'CEO analysis completed', metadata: { projectId, step: 'discovery' } });

      return { success: true, data: ceoResult.data };
    } catch (err: any) {
      return this.handleFailure(projectId, 'DISCOVERY', err);
    }
  }

  public static async executePlanning(projectId: string, ceoData: any): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      await LifecycleManager.transition(projectId, state.currentPhase, 'PLANNING', 'Starting planning stage');
      ExecutionStateService.updatePhase(projectId, 'PLANNING');
      ExecutionStateService.addActiveAgent(projectId, 'PRODUCT_MANAGER');
      ExecutionStateService.setMilestoneAndTask(projectId, 'Requirements Refinement', 'Refining product specifications');
      await companyEventBus.publish('TASK_STARTED', projectId, { task: 'refineRequirements', role: 'PRODUCT_MANAGER' }, 'CompanyOrchestrator');

      const pmResult = await refineRequirements(projectId, ceoData);
      if (!pmResult.success) {
        throw new Error(pmResult.error.message);
      }

      const review = await reviewArtifact(projectId, 'Refined Requirements', pmResult.data);
      if (review.success && review.data.verdict === 'REJECTED') {
        throw new Error(`Requirements rejected by review committee: ${review.data.summary}`);
      }

      ExecutionStateService.removeActiveAgent(projectId, 'PRODUCT_MANAGER');
      ExecutionStateService.completeTask(projectId, 'refineRequirements', 'PRODUCT_MANAGER');
      await companyEventBus.publish('PRODUCT_APPROVED', projectId, { pmResult: pmResult.data }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step.completed', message: 'Requirements refinement completed', metadata: { projectId, step: 'planning' } });

      return { success: true, data: pmResult.data };
    } catch (err: any) {
      return this.handleFailure(projectId, 'PLANNING', err);
    }
  }

  public static async executeArchitecture(projectId: string, pmData: any): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      await LifecycleManager.transition(projectId, state.currentPhase, 'ARCHITECTURE', 'Starting architecture stage');
      ExecutionStateService.updatePhase(projectId, 'ARCHITECTURE');
      ExecutionStateService.addActiveAgent(projectId, 'ARCHITECT');
      ExecutionStateService.setMilestoneAndTask(projectId, 'System Architecture', 'Designing system architecture and data models');
      await companyEventBus.publish('TASK_STARTED', projectId, { task: 'designArchitecture', role: 'ARCHITECT' }, 'CompanyOrchestrator');

      const architectInput = {
        features: pmData.featureSpecs.map((fs: any) => ({ name: fs.name, description: fs.description })),
        userStories: pmData.userStories.map((us: any) => ({ as: us.asA, iWant: us.iWant, soThat: us.soThat, priority: us.priority })),
        priorities: pmData.userStories.map((us: any) => us.priority),
        constraints: pmData.nonFunctionalRequirements.map((nf: any) => `${nf.category}: ${nf.requirement}`),
      };

      const archResult = await designArchitecture(projectId, architectInput);
      if (!archResult.success) {
        throw new Error(archResult.error.message);
      }

      const review = await reviewArtifact(projectId, 'Architecture', archResult.data);
      if (review.success && review.data.verdict === 'REJECTED') {
        throw new Error(`Architecture rejected by review committee: ${review.data.summary}`);
      }

      await saveArchitectSummary(projectId, archResult.data).catch(() => {});
      ExecutionStateService.removeActiveAgent(projectId, 'ARCHITECT');
      ExecutionStateService.completeTask(projectId, 'designArchitecture', 'ARCHITECT');
      await companyEventBus.publish('ARCHITECTURE_APPROVED', projectId, { archResult: archResult.data }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step.completed', message: 'Architecture design completed', metadata: { projectId, step: 'architecture' } });

      return { success: true, data: archResult.data };
    } catch (err: any) {
      return this.handleFailure(projectId, 'ARCHITECTURE', err);
    }
  }

  public static async executeExecution(projectId: string, archData: any, requirements: any): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      await LifecycleManager.transition(projectId, state.currentPhase, 'EXECUTION', 'Starting code execution stage');
      ExecutionStateService.updatePhase(projectId, 'EXECUTION');
      ExecutionStateService.addActiveAgent(projectId, 'DEVELOPER');
      ExecutionStateService.setMilestoneAndTask(projectId, 'Software Factory', 'Implementing code modules and services');
      await companyEventBus.publish('TASK_STARTED', projectId, { task: 'implementArchitecture', role: 'DEVELOPER' }, 'CompanyOrchestrator');

      // Execute via AI Runtime Engine
      await AIRuntimeEngine.executeTask({
        projectId,
        agentRole: 'DEVELOPER' as any,
        taskId: `dev_task_${Date.now()}`,
        taskTitle: 'Implement core software modules',
        taskDescription: 'Generate code based on approved architecture',
        systemPrompt: 'You are Senior Software Engineer AI. Implement the architecture.',
      }).catch(() => {});

      const devResult = await implementArchitecture(projectId, archData, requirements);
      if (!devResult.success) {
        throw new Error(devResult.error.message);
      }

      await saveDeveloperSummary(projectId, devResult.data).catch(() => {});
      ExecutionStateService.removeActiveAgent(projectId, 'DEVELOPER');
      ExecutionStateService.completeTask(projectId, 'implementArchitecture', 'DEVELOPER');
      await companyEventBus.publish('BUILD_COMPLETED', projectId, { devResult: devResult.data }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step.completed', message: 'Implementation completed', metadata: { projectId, step: 'execution' } });

      return { success: true, data: devResult.data };
    } catch (err: any) {
      return this.handleFailure(projectId, 'EXECUTION', err);
    }
  }

  public static async executeReview(projectId: string, devData: any): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      await LifecycleManager.transition(projectId, state.currentPhase, 'REVIEW', 'Starting quality assurance review stage');
      ExecutionStateService.updatePhase(projectId, 'REVIEW');
      ExecutionStateService.addActiveAgent(projectId, 'QA');
      ExecutionStateService.setMilestoneAndTask(projectId, 'Quality Assurance', 'Running test suites and security scans');
      await companyEventBus.publish('TASK_STARTED', projectId, { task: 'reviewImplementation', role: 'QA' }, 'CompanyOrchestrator');

      // Execute via AI Runtime Engine
      await AIRuntimeEngine.executeTask({
        projectId,
        agentRole: 'QA_ENGINEER' as any,
        taskId: `qa_task_${Date.now()}`,
        taskTitle: 'Run Vitest suite and lint checks',
        taskDescription: 'Validate code quality and security standards',
        systemPrompt: 'You are Lead QA Engineer AI. Validate codebase.',
      }).catch(() => {});

      const qaResult = await reviewImplementation(projectId, devData);
      if (!qaResult.success) {
        throw new Error(qaResult.error.message);
      }

      await saveQASummary(projectId, qaResult.data).catch(() => {});
      ExecutionStateService.removeActiveAgent(projectId, 'QA');
      ExecutionStateService.completeTask(projectId, 'reviewImplementation', 'QA');

      const hasCritical = qaResult.data.qualityReport?.issues?.some((i: any) => i.severity === 'CRITICAL');
      if (hasCritical) {
        throw new Error('Critical quality or security issues detected during QA review.');
      }

      await companyEventBus.publish('REVIEW_COMPLETED', projectId, { qaResult: qaResult.data }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.step.completed', message: 'QA review completed', metadata: { projectId, step: 'review' } });

      return { success: true, data: qaResult.data };
    } catch (err: any) {
      return this.handleFailure(projectId, 'REVIEW', err);
    }
  }

  public static async executeComplete(projectId: string, resultData: any): Promise<ApiResult<any>> {
    try {
      const state = ExecutionStateService.getState(projectId);
      if (state.currentPhase === 'REVIEW') {
        await LifecycleManager.transition(projectId, 'REVIEW', 'DEPLOYMENT_READY', 'All reviews passed');
        ExecutionStateService.updatePhase(projectId, 'DEPLOYMENT_READY');
      }

      await LifecycleManager.transition(projectId, ExecutionStateService.getState(projectId).currentPhase, 'COMPLETED', 'Project workflow complete');
      ExecutionStateService.updatePhase(projectId, 'COMPLETED');
      ExecutionStateService.updateHealth(projectId, 'HEALTHY');
      ExecutionStateService.setMilestoneAndTask(projectId, 'Project Completed', 'All deliverables completed successfully');

      await prisma.project.update({ where: { id: projectId }, data: { status: 'COMPLETED' } }).catch(() => {});
      await companyEventBus.publish('PROJECT_COMPLETED', projectId, { resultData }, 'CompanyOrchestrator');
      await recordTimelineEvent({ type: 'workflow.completed', message: 'Full autonomous software company execution completed successfully.', metadata: { projectId } });

      return { success: true, data: resultData };
    } catch (err: any) {
      return this.handleFailure(projectId, 'DEPLOYMENT_READY', err);
    }
  }

  public static async runFullPipeline(
    projectId: string,
    userIdea: string,
    config: PipelineConfig = { autoAdvance: true, maxRetries: 1, recoverOnFailure: true },
  ): Promise<ApiResult<any>> {
    ExecutionStateService.initState(projectId, 'CREATED');
    await companyEventBus.publish('PROJECT_CREATED', projectId, { userIdea }, 'CompanyOrchestrator');

    // Step 1: Discovery
    const discoveryRes = await this.executeWithRetry(() => this.executeDiscovery(projectId, userIdea), config, projectId, 'DISCOVERY');
    if (!discoveryRes.success) return discoveryRes;

    // Step 2: Planning
    const planningRes = await this.executeWithRetry(() => this.executePlanning(projectId, discoveryRes.data), config, projectId, 'PLANNING');
    if (!planningRes.success) return planningRes;

    // Step 3: Architecture
    const archRes = await this.executeWithRetry(() => this.executeArchitecture(projectId, planningRes.data), config, projectId, 'ARCHITECTURE');
    if (!archRes.success) return archRes;

    // Step 4: Execution (Software Factory)
    const execRes = await this.executeWithRetry(() => this.executeExecution(projectId, archRes.data, discoveryRes.data.requirements), config, projectId, 'EXECUTION');
    if (!execRes.success) return execRes;

    // Step 5: Review
    const reviewRes = await this.executeWithRetry(() => this.executeReview(projectId, execRes.data), config, projectId, 'REVIEW');
    if (!reviewRes.success) return reviewRes;

    // Step 6: Completion
    const compRes = await this.executeComplete(projectId, {
      discovery: discoveryRes.data,
      planning: planningRes.data,
      architecture: archRes.data,
      execution: execRes.data,
      review: reviewRes.data,
    });

    return compRes;
  }

  private static async executeWithRetry(
    fn: () => Promise<ApiResult<any>>,
    config: PipelineConfig,
    projectId: string,
    stage: any,
  ): Promise<ApiResult<any>> {
    let attempts = 0;
    const maxRetries = config.maxRetries ?? 1;

    while (attempts <= maxRetries) {
      const result = await fn();
      if (result.success) return result;

      attempts++;
      if (config.recoverOnFailure && attempts <= maxRetries) {
        await companyEventBus.publish('RECOVERY_ATTEMPTED', projectId, { stage, attempt: attempts }, 'CompanyOrchestrator');
        await new Promise((res) => setTimeout(res, config.retryDelayMs ?? 100));
      } else {
        return result;
      }
    }
    return { success: false, error: { message: `Execution failed at stage ${stage} after retries.`, code: 'PIPELINE_FAILED' } };
  }

  private static async handleFailure(projectId: string, stage: any, err: any): Promise<ApiResult<any>> {
    const message = err?.message || 'Unknown execution error';
    console.error(`[CompanyOrchestrator] Failure in stage ${stage}:`, err);

    const state = ExecutionStateService.getState(projectId);
    if (LifecycleManager.canTransition(state.currentPhase, 'FAILED')) {
      await LifecycleManager.transition(projectId, state.currentPhase, 'FAILED', message).catch(() => {});
    }
    ExecutionStateService.updateHealth(projectId, 'FAILED', {
      message,
      code: `${stage}_FAILED`,
      timestamp: Date.now(),
      stage,
      recoverable: true,
    });

    await companyEventBus.publish('EXECUTION_FAILED', projectId, { stage, error: message }, 'CompanyOrchestrator');
    await recordTimelineEvent({ type: 'workflow.failed', message: `Stage ${stage} failed: ${message}`, metadata: { projectId, stage, error: message } });

    return {
      success: false,
      error: { message: `Stage ${stage} failed: ${message}`, code: `${stage}_FAILED` },
    };
  }
}
