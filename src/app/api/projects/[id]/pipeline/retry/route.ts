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

/**
 * Resume / retry generation after a stall, failure, or credits issue.
 */
export async function POST(
  _request: Request,
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
    const stateRes = await WorkflowManager.getOrInitState(projectId);
    if (!stateRes.success) {
      return NextResponse.json(stateRes, { status: 400 });
    }

    const state = stateRes.data;
    const wf = await findWorkflowScalars(projectId);
    const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
    const generationPhase = meta.generationPhase as ProjectLifecycleState | undefined;
    const pausedAt = state.pausedAtPhase;

    let targetPhase: ProjectLifecycleState | null = null;

    if (state.currentPhase === 'FAILED') {
      targetPhase =
        generationPhase && PIPELINE_PHASE_DEFINITIONS[generationPhase]
          ? generationPhase
          : pausedAt && PIPELINE_PHASE_DEFINITIONS[pausedAt]
            ? pausedAt
            : 'DISCOVERY_RUNNING';

      const transition = await WorkflowManager.transitionState(
        projectId,
        targetPhase,
        'Retrying generation after interruption',
      );
      if (!transition.success) {
        return NextResponse.json(transition, { status: 400 });
      }
    } else if (
      state.currentPhase.endsWith('_RUNNING') ||
      state.currentPhase === 'MONITORING'
    ) {
      targetPhase = state.currentPhase;
    } else if (state.currentPhase === 'PAUSED' && pausedAt) {
      // Resume regenerating the paused phase
      targetPhase = pausedAt;
      await WorkflowManager.setPausedAtPhase(projectId, null);
      const transition = await WorkflowManager.transitionState(
        projectId,
        targetPhase,
        'Resuming generation',
      );
      if (!transition.success) {
        return NextResponse.json(transition, { status: 400 });
      }
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

    // Clear any dead lock from a cancelled/hung Development run
    CompanyPipelineEngine.forceReleaseLock(projectId);
    try {
      const { cancelBuild } = await import('@/ai/agents/roles/developer/developer.service');
      cancelBuild(projectId);
    } catch {}

    setTimeout(() => {
      CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
        console.error('[Pipeline Retry] runPipeline error:', err);
      });
    }, 50);

    return NextResponse.json({
      success: true,
      data: { resumed: true, phase: targetPhase || state.currentPhase },
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
