import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';
import { pulseGenerationHeartbeat } from '@/core/company-orchestration/generation-status';
import {
  PIPELINE_PHASE_DEFINITIONS,
  type ProjectLifecycleState,
} from '@/core/company-orchestration/types';
import { findWorkflowScalars } from '@/core/company-orchestration/workflow-state-access';
import { getProjectFileEvidence } from '@/core/company-orchestration/implementation-file-gate';

/**
 * Resume / regenerate after stall, failure, credits, or hollow Development (no files).
 * Body (optional): { forcePhase?: 'DEVELOPMENT_RUNNING' }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id: projectId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      forcePhase?: ProjectLifecycleState;
    };

    const stateRes = await WorkflowManager.getOrInitState(projectId);
    if (!stateRes.success) {
      return NextResponse.json(stateRes, { status: 400 });
    }

    const state = stateRes.data;
    const wf = await findWorkflowScalars(projectId);
    const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
    const generationPhase = meta.generationPhase as ProjectLifecycleState | undefined;
    const pausedAt = state.pausedAtPhase;
    const evidence = await getProjectFileEvidence(projectId);

    let targetPhase: ProjectLifecycleState | null = null;

    const phaseOrder = [
      'TESTING_RUNNING',
      'REVIEW_RUNNING',
      'SECURITY_RUNNING',
      'DEPLOYMENT_RUNNING',
      'MONITORING',
      'COMPLETED',
    ];
    const pastDevelopment =
      state.currentPhase === 'DEVELOPMENT_RUNNING' ||
      state.currentPhase === 'FAILED' ||
      state.completedPhases.includes('DEVELOPMENT_RUNNING') ||
      phaseOrder.includes(state.currentPhase);

    // Only reopen Development when we claim(ed) it done or are past it — not during Discovery.
    const needsDevRegen =
      body.forcePhase === 'DEVELOPMENT_RUNNING' ||
      (!evidence.ok && pastDevelopment);

    if (needsDevRegen && state.currentPhase !== 'CREATED') {
      const reopen = await WorkflowManager.forceReopenPhase(
        projectId,
        'DEVELOPMENT_RUNNING',
        evidence.message || 'Regenerating Development — creating real project files',
      );
      if (!reopen.success) {
        return NextResponse.json(reopen, { status: 400 });
      }
      targetPhase = 'DEVELOPMENT_RUNNING';
    } else if (state.currentPhase === 'FAILED') {
      targetPhase =
        (meta.resumePhase as ProjectLifecycleState) &&
        PIPELINE_PHASE_DEFINITIONS[meta.resumePhase as ProjectLifecycleState]
          ? (meta.resumePhase as ProjectLifecycleState)
          : generationPhase && PIPELINE_PHASE_DEFINITIONS[generationPhase]
            ? generationPhase
            : pausedAt && PIPELINE_PHASE_DEFINITIONS[pausedAt]
              ? pausedAt
              : 'DISCOVERY_RUNNING';

      if (!evidence.ok) {
        targetPhase = 'DEVELOPMENT_RUNNING';
      }

      const transition = await WorkflowManager.transitionState(
        projectId,
        targetPhase,
        'Resuming pipeline from the stopped step',
      );
      if (!transition.success) {
        // Fallback force reopen
        const reopen = await WorkflowManager.forceReopenPhase(
          projectId,
          targetPhase,
          'Force resume after failed transition',
        );
        if (!reopen.success) return NextResponse.json(reopen, { status: 400 });
      }
    } else if (
      state.currentPhase.endsWith('_RUNNING') ||
      state.currentPhase === 'MONITORING'
    ) {
      targetPhase = !evidence.ok ? 'DEVELOPMENT_RUNNING' : state.currentPhase;
      if (targetPhase === 'DEVELOPMENT_RUNNING' && state.currentPhase !== 'DEVELOPMENT_RUNNING') {
        await WorkflowManager.forceReopenPhase(
          projectId,
          'DEVELOPMENT_RUNNING',
          'Missing files — regenerating Development',
        );
      }
    } else if (state.currentPhase === 'PAUSED' && pausedAt) {
      targetPhase = !evidence.ok ? 'DEVELOPMENT_RUNNING' : pausedAt;
      await WorkflowManager.setPausedAtPhase(projectId, null);
      await WorkflowManager.forceReopenPhase(
        projectId,
        targetPhase,
        'Resuming generation',
      );
    } else if (state.currentPhase === 'CREATED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Start the pipeline first from Mission Control.',
            code: 'NOT_STARTED',
          },
        },
        { status: 400 },
      );
    } else if (state.currentPhase === 'COMPLETED' && evidence.ok) {
      return NextResponse.json({
        success: true,
        data: { resumed: false, phase: 'COMPLETED', message: 'Already complete with files' },
      });
    }

    await pulseGenerationHeartbeat(projectId, {
      message: targetPhase
        ? `Resuming ${PIPELINE_PHASE_DEFINITIONS[targetPhase]?.department || targetPhase}…`
        : 'Resuming generation…',
      phase: targetPhase || state.currentPhase,
      department: targetPhase
        ? PIPELINE_PHASE_DEFINITIONS[targetPhase]?.department
        : undefined,
      clearError: true,
    });

    CompanyPipelineEngine.forceReleaseLock(projectId);
    // Do NOT cancel an active developer build on Resume — only release pipeline lock.
    // (Previous cancelBuild caused "Build cancelled" loops.)

    setTimeout(() => {
      CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
        console.error('[Pipeline Retry] runPipeline error:', err);
      });
    }, 50);

    return NextResponse.json({
      success: true,
      data: {
        resumed: true,
        phase: targetPhase || state.currentPhase,
        regeneratingDevelopment: needsDevRegen && !evidence.ok,
      },
    });
  } catch (error: any) {
    console.error('[Pipeline Retry] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error?.message || 'Failed to retry', code: 'INTERNAL_ERROR' },
      },
      { status: 500 },
    );
  }
}
