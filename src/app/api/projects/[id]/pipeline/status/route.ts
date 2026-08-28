import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';
import { PIPELINE_PHASE_DEFINITIONS } from '@/core/company-orchestration/types';
import type { ProjectLifecycleState } from '@/core/company-orchestration/types';
import { getTimelineEvents } from '@/features/ai-workspace/services/timeline.service';
import { buildLiveGenerationState } from '@/core/company-orchestration/generation-status';
import { prisma } from '@/lib/prisma';
import { getUsageStats } from '@/ai/services/usage.service';
import { getProjectCreditSnapshot } from '@/core/billing/project-credits';
import { buildDeliverableChecklistForState } from '@/core/company-orchestration/deliverable-checklist';

type PipelinePhaseId =
  | 'discovery'
  | 'clarification'
  | 'proposal'
  | 'strategy'
  | 'product'
  | 'analysis'
  | 'architecture'
  | 'design'
  | 'planning'
  | 'development'
  | 'testing'
  | 'review'
  | 'security'
  | 'deployment'
  | 'completed';

/** Map lifecycle → UI phase (aligned with 05_WORKFLOWS.md) */
const LIFECYCLE_TO_PHASE_ID: Record<string, PipelinePhaseId> = {
  DISCOVERY_RUNNING: 'discovery',
  CLARIFICATION_RUNNING: 'clarification',
  PROPOSAL_RUNNING: 'proposal',
  STRATEGY_RUNNING: 'strategy',
  PRODUCT_RUNNING: 'product',
  ANALYSIS_RUNNING: 'analysis',
  DESIGN_RUNNING: 'design',
  ARCHITECTURE_RUNNING: 'architecture',
  PLANNING_RUNNING: 'planning',
  DEVELOPMENT_RUNNING: 'development',
  TESTING_RUNNING: 'testing',
  REVIEW_RUNNING: 'review',
  SECURITY_RUNNING: 'security',
  DEPLOYMENT_RUNNING: 'deployment',
  MONITORING: 'completed',
  COMPLETED: 'completed',
};

const ALL_PHASES: { id: PipelinePhaseId; name: string; agentRole: string }[] = [
  { id: 'discovery', name: 'Idea', agentRole: 'CEO' },
  { id: 'clarification', name: 'Analysis', agentRole: 'Product Manager' },
  { id: 'proposal', name: 'Analysis', agentRole: 'Product Manager' },
  { id: 'strategy', name: 'Analysis', agentRole: 'CEO' },
  { id: 'product', name: 'Analysis', agentRole: 'Product Manager' },
  { id: 'analysis', name: 'Analysis', agentRole: 'Product Manager' },
  { id: 'planning', name: 'Planning', agentRole: 'Architect' },
  { id: 'architecture', name: 'Architecture', agentRole: 'Architect' },
  { id: 'design', name: 'Design', agentRole: 'Designer' },
  { id: 'development', name: 'Development', agentRole: 'Engineers' },
  { id: 'testing', name: 'Testing', agentRole: 'QA' },
  { id: 'review', name: 'Testing', agentRole: 'QA' },
  { id: 'security', name: 'Security Review', agentRole: 'Security' },
  { id: 'deployment', name: 'Deployment', agentRole: 'DevOps' },
  { id: 'completed', name: 'Completed', agentRole: '' },
];

/** Full company from 04_AI_COMPANY.md */
const DOC_EMPLOYEES: {
  id: string;
  name: string;
  role: string;
  avatar: string;
  activePhases: PipelinePhaseId[];
}[] = [
  { id: 'emp_ceo', name: 'CEO', role: 'CEO · Vision', avatar: '👔', activePhases: ['discovery', 'strategy'] },
  {
    id: 'emp_pm',
    name: 'Product Manager',
    role: 'Product Manager · Requirements',
    avatar: '📋',
    activePhases: ['clarification', 'proposal', 'product', 'analysis'],
  },
  {
    id: 'emp_arch',
    name: 'Architect',
    role: 'Architect · System design',
    avatar: '🏗️',
    activePhases: ['planning', 'architecture'],
  },
  {
    id: 'emp_design',
    name: 'Designer',
    role: 'Designer · UX / UI',
    avatar: '🎨',
    activePhases: ['design'],
  },
  {
    id: 'emp_fe',
    name: 'Frontend',
    role: 'Frontend · Interfaces',
    avatar: '💻',
    activePhases: ['development'],
  },
  {
    id: 'emp_be',
    name: 'Backend',
    role: 'Backend · APIs',
    avatar: '⚙️',
    activePhases: ['development'],
  },
  {
    id: 'emp_db',
    name: 'Database',
    role: 'Database · Schema',
    avatar: '🗄️',
    activePhases: ['development'],
  },
  {
    id: 'emp_qa',
    name: 'QA',
    role: 'QA · Verification',
    avatar: '🧪',
    activePhases: ['testing', 'review'],
  },
  {
    id: 'emp_sec',
    name: 'Security',
    role: 'Security · Review',
    avatar: '🔒',
    activePhases: ['security'],
  },
  {
    id: 'emp_dops',
    name: 'DevOps',
    role: 'DevOps · Deployment',
    avatar: '🚀',
    activePhases: ['deployment'],
  },
];

const PHASE_ORDER = ALL_PHASES.map((p) => p.id);

const LIFECYCLE_ACTIVITY: Partial<Record<string, string>> = {
  DISCOVERY_RUNNING: 'Product Discovery analyzing the idea',
  CLARIFICATION_RUNNING: 'Clarifying requirements and scope',
  PROPOSAL_RUNNING: 'Drafting the product proposal',
  STRATEGY_RUNNING: 'CEO defining business strategy',
  PRODUCT_RUNNING: 'Product Manager writing the PRD',
  ANALYSIS_RUNNING: 'Turning the PRD into software requirements',
  PLANNING_RUNNING: 'Planning milestones and work packages',
  ARCHITECTURE_RUNNING: 'Architect designing the system',
  DESIGN_RUNNING: 'Designer creating UX/UI specs',
  DEVELOPMENT_RUNNING: 'Engineers implementing the product',
  TESTING_RUNNING: 'QA verifying quality',
  REVIEW_RUNNING: 'Review committee scoring the work',
  SECURITY_RUNNING: 'Security reviewing the release',
  DEPLOYMENT_RUNNING: 'DevOps preparing deployment',
  MONITORING: 'Monitoring the live release',
  PAUSED: 'Waiting for your approval',
};

function getPhaseStatus(
  phaseId: PipelinePhaseId,
  currentPhaseId: PipelinePhaseId,
  lifecyclePhase: string,
): 'completed' | 'active' | 'pending' | 'failed' {
  if (lifecyclePhase === 'FAILED') return 'failed';
  if (lifecyclePhase === 'COMPLETED' && phaseId === 'completed') return 'active';

  const currentIdx = PHASE_ORDER.indexOf(currentPhaseId);
  const phaseIdx = PHASE_ORDER.indexOf(phaseId);

  if (phaseIdx < currentIdx) return 'completed';
  if (phaseIdx === currentIdx) return 'active';
  return 'pending';
}

function buildEmployees(
  currentPhaseId: PipelinePhaseId,
  phaseStatus: 'running' | 'completed' | 'approval' | 'waiting' | 'failed',
) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhaseId);

  return DOC_EMPLOYEES.map((emp) => {
    const isActiveNow = emp.activePhases.includes(currentPhaseId) && phaseStatus !== 'waiting';
    const lastIdx = Math.max(...emp.activePhases.map((p) => PHASE_ORDER.indexOf(p)));
    const firstIdx = Math.min(...emp.activePhases.map((p) => PHASE_ORDER.indexOf(p)));

    let status: 'active' | 'idle' | 'completed' | 'waiting' = 'idle';
    if (phaseStatus === 'waiting') {
      status = 'idle';
    } else if (isActiveNow) {
      status = phaseStatus === 'approval' ? 'waiting' : 'active';
    } else if (lastIdx < currentIdx) {
      status = 'completed';
    } else if (firstIdx === currentIdx + 1) {
      status = 'waiting';
    }

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      avatar: emp.avatar,
      status,
      currentTask: isActiveNow ? `Working on ${currentPhaseId}` : undefined,
    };
  });
}

function buildActivityLines(
  currentLifecyclePhase: string,
  currentPhaseId: PipelinePhaseId,
  phaseStatus: string,
  feed: { id: string; message: string; agentRole: string; timestamp?: string; category?: string }[],
  timeline: { id: string; message: string; createdAt: Date; metadata?: Record<string, unknown> }[],
) {
  const timelineForProject = timeline
    .filter((e) => {
      const msg = e.message || '';
      if (msg.startsWith('Sync ')) return false;
      return true;
    })
    .slice(-20)
    .reverse()
    .map((item) => ({
      id: item.id,
      agentName: 'Mission Control',
      agentAvatar: '🛰️',
      action: item.message.replace(/^[^\w]+ /, ''),
      timestamp: item.createdAt.toISOString(),
      type: item.message.toLowerCase().includes('completed') ? 'completed' : 'started',
    }));

  const cleanedFeed = feed
    .filter((item) => item.message && !item.message.startsWith('Sync '))
    .slice(0, 30)
    .map((item) => {
      let actionType = 'started';
      if (item.category === 'milestone') actionType = 'completed';
      else if (item.category === 'approval') actionType = 'approved';
      else if (item.message.toLowerCase().includes('created') || item.message.toLowerCase().includes('generated'))
        actionType = 'created';
      else if (item.message.toLowerCase().includes('review')) actionType = 'reviewed';
      else if (item.message.toLowerCase().includes('deploy')) actionType = 'deployed';

      return {
        id: item.id,
        agentName: item.agentRole || 'AI Agent',
        agentAvatar: '🤖',
        action: item.message,
        timestamp: item.timestamp || new Date().toISOString(),
        type: actionType,
      };
    });

  const merged = [...timelineForProject, ...cleanedFeed]
    .filter((item, idx, arr) => {
      const action = String(item.action || '');
      // Drop re-kick spam: identical "Executing department…" lines
      if (/executing department/i.test(action)) {
        return arr.findIndex((x) => x.action === item.action) === idx;
      }
      return true;
    })
    .slice(0, 12);
  if (merged.length > 0) return merged;

  const live =
    LIFECYCLE_ACTIVITY[currentLifecyclePhase] ||
    (phaseStatus === 'approval'
      ? 'Waiting for your approval to continue'
      : `${currentPhaseId} in progress`);

  return [
    {
      id: 'default_act_0',
      agentName: 'Mission Control',
      agentAvatar: '🛰️',
      action: live,
      timestamp: new Date().toISOString(),
      type: phaseStatus === 'running' ? 'started' : 'created',
    },
  ];
}

export async function GET(
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

    const workspaceState = WorkspaceService.getWorkspaceState(projectId);
    let lifecycleRes = await WorkflowManager.getOrInitState(projectId);
    let lifecycle = lifecycleRes.success ? lifecycleRes.data : null;

    // If workflow load failed, still honor Project.status so completed projects don't show Start/0%.
    if (!lifecycle) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      });
      if (project?.status === 'COMPLETED' || project?.status === 'ARCHIVED') {
        lifecycle = {
          projectId,
          currentDepartment: 'Company Operations',
          activeAgent: 'SYSTEM',
          currentPhase: 'COMPLETED',
          currentArtifact: 'FinalRelease',
          progress: 100,
          nextAction: 'Pipeline completed',
          waitingApprovals: [],
          completedPhases: [],
          risks: [],
        };
      }
    }

    let currentLifecyclePhase = lifecycle?.currentPhase || 'CREATED';
    const completedPhases: string[] = Array.isArray(lifecycle?.completedPhases)
      ? lifecycle!.completedPhases
      : [];
    let waitingApprovals: string[] = Array.isArray(lifecycle?.waitingApprovals)
      ? lifecycle!.waitingApprovals
      : [];

    // Keep in-memory workspace progress aligned with DB (survives server restarts for UI fallback).
    if (lifecycle) {
      if (currentLifecyclePhase === 'COMPLETED') {
        WorkspaceService.markPipelineCompleted(projectId);
      } else {
        WorkspaceService.updateFromPipelinePhase(
          projectId,
          currentLifecyclePhase as ProjectLifecycleState,
        );
      }
    }

    // Heal: pending approval while still *_RUNNING (UI showed approve, API said NOT_PAUSED)
    if (
      currentLifecyclePhase !== 'PAUSED' &&
      currentLifecyclePhase !== 'COMPLETED' &&
      currentLifecyclePhase !== 'FAILED'
    ) {
      try {
        const pendingApproval = await prisma.approvalHistory.findFirst({
          where: { projectId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        });
        if (pendingApproval?.approvalType) {
          const { ApprovalManager } = await import(
            '@/core/company-orchestration/approval-manager'
          );
          await ApprovalManager.ensurePausedForApproval(
            projectId,
            pendingApproval.approvalType as any,
            (pendingApproval.phase as ProjectLifecycleState) ||
              (currentLifecyclePhase.endsWith('_RUNNING')
                ? (currentLifecyclePhase as ProjectLifecycleState)
                : undefined),
          );
          lifecycleRes = await WorkflowManager.getOrInitState(projectId);
          lifecycle = lifecycleRes.success ? lifecycleRes.data : lifecycle;
          currentLifecyclePhase = lifecycle?.currentPhase || currentLifecyclePhase;
          waitingApprovals = lifecycle?.waitingApprovals?.length
            ? [...lifecycle.waitingApprovals]
            : waitingApprovals;
        }
      } catch (err) {
        console.warn('[Pipeline Status] approval heal failed:', err);
      }
    }

    // Heal: PAUSED but waitingApprovals empty (jsonb write used to fail) → Approve UI missing.
    if (
      (currentLifecyclePhase === 'PAUSED' || waitingApprovals.length === 0) &&
      currentLifecyclePhase !== 'COMPLETED' &&
      currentLifecyclePhase !== 'FAILED'
    ) {
      try {
        const pendingRows = await prisma.approvalHistory.findMany({
          where: { projectId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        if (pendingRows.length > 0) {
          const fromDb = pendingRows.map((r) => r.approvalType).filter(Boolean);
          const merged = [...new Set([...waitingApprovals, ...fromDb])];
          if (merged.length > 0 && (waitingApprovals.length === 0 || merged.length !== waitingApprovals.length)) {
            waitingApprovals = merged;
            const { setWorkflowTextArray } = await import(
              '@/core/company-orchestration/workflow-state-access'
            );
            await setWorkflowTextArray(projectId, 'waitingApprovals', waitingApprovals);
            if (currentLifecyclePhase !== 'PAUSED') {
              const { ApprovalManager } = await import(
                '@/core/company-orchestration/approval-manager'
              );
              await ApprovalManager.ensurePausedForApproval(
                projectId,
                pendingRows[0]!.approvalType as any,
                pendingRows[0]?.phase as ProjectLifecycleState,
              );
              currentLifecyclePhase = 'PAUSED';
            }
          }
        }
      } catch (err) {
        console.warn('[Pipeline Status] waitingApprovals list heal failed:', err);
      }
    }

    const pausedAt = lifecycle?.pausedAtPhase as ProjectLifecycleState | undefined;
    let genMetaEarly: Record<string, unknown> = {};
    try {
      const wfRowEarly = await prisma.projectWorkflowState.findUnique({
        where: { projectId },
        select: { metadata: true },
      });
      genMetaEarly = (wfRowEarly?.metadata as Record<string, unknown>) || {};
    } catch (err: any) {
      console.warn('[Pipeline Status] workflow metadata read failed:', err?.message);
    }
    const generationPhaseEarly = genMetaEarly.generationPhase as ProjectLifecycleState | undefined;

    const currentPhaseId =
      currentLifecyclePhase === 'PAUSED' && pausedAt
        ? LIFECYCLE_TO_PHASE_ID[pausedAt] || 'architecture'
        : currentLifecyclePhase === 'FAILED' && generationPhaseEarly
          ? LIFECYCLE_TO_PHASE_ID[generationPhaseEarly] || 'discovery'
          : LIFECYCLE_TO_PHASE_ID[currentLifecyclePhase] || 'discovery';

    let phaseStatus: 'running' | 'completed' | 'approval' | 'waiting' | 'failed' = 'waiting';
    if (currentLifecyclePhase === 'COMPLETED') {
      phaseStatus = 'completed';
    } else if (currentLifecyclePhase === 'FAILED') {
      phaseStatus = 'failed';
    } else if (currentLifecyclePhase === 'PAUSED' || waitingApprovals.length > 0) {
      phaseStatus = 'approval';
    } else if (currentLifecyclePhase !== 'CREATED') {
      phaseStatus = 'running';
    }

    // Progress for PAUSED: use paused phase %, never show 0% just because PAUSED def is 0.
    let displayProgress =
      lifecycle?.progress ?? workspaceState.overallProgress ?? 0;
    if (currentLifecyclePhase === 'COMPLETED') {
      displayProgress = 100;
    } else if (currentLifecyclePhase === 'PAUSED' && pausedAt) {
      const pausedPct = PIPELINE_PHASE_DEFINITIONS[pausedAt]?.progressPercentage;
      if (typeof pausedPct === 'number' && pausedPct > displayProgress) {
        displayProgress = pausedPct;
      }
    }

    const { getProjectFileEvidence } = await import(
      '@/core/company-orchestration/implementation-file-gate'
    );
    const fileEvidence = await getProjectFileEvidence(projectId).catch(() => null);
    const needsDevelopmentRegeneration = Boolean(
      fileEvidence &&
        !fileEvidence.ok &&
        (currentLifecyclePhase === 'COMPLETED' ||
          currentLifecyclePhase === 'FAILED' ||
          currentLifecyclePhase === 'DEVELOPMENT_RUNNING' ||
          completedPhases.includes('DEVELOPMENT_RUNNING') ||
          [
            'TESTING_RUNNING',
            'REVIEW_RUNNING',
            'SECURITY_RUNNING',
            'DEPLOYMENT_RUNNING',
            'MONITORING',
          ].includes(currentLifecyclePhase)),
    );

    // Never show 100% Done when Explorer has no real app files
    if (needsDevelopmentRegeneration) {
      displayProgress = Math.min(
        displayProgress,
        PIPELINE_PHASE_DEFINITIONS.DEVELOPMENT_RUNNING.progressPercentage,
      );
      if (currentLifecyclePhase === 'COMPLETED' || phaseStatus === 'completed') {
        phaseStatus = 'failed';
      }
    }

    const genMeta = genMetaEarly;
    const lastGenerationError = (genMeta.lastGenerationError as
      | { message?: string; code?: string; at?: string }
      | undefined) || null;
    const heartbeatAt =
      typeof genMeta.generationHeartbeatAt === 'string'
        ? genMeta.generationHeartbeatAt
        : null;
    const regenerating = Boolean(
      genMeta.revisionFeedback ||
        (typeof genMeta.generationMessage === 'string' &&
          String(genMeta.generationMessage).toLowerCase().includes('regenerat')),
    );

    if (currentLifecyclePhase !== 'CREATED' && currentLifecyclePhase !== 'PAUSED' && currentLifecyclePhase !== 'FAILED') {
      // Only re-kick when nothing is already owning the pipeline.
      // Previous behavior kicked on EVERY status poll; after lock TTL the second run
      // cancelled Development mid-build → endless "Build cancelled" / Stalled loop.
      const locked = CompanyPipelineEngine.isPipelineLocked(projectId);
      const heartbeatAgeMs = heartbeatAt ? Date.now() - Date.parse(heartbeatAt) : Number.POSITIVE_INFINITY;
      const heartbeatFresh = Number.isFinite(heartbeatAgeMs) && heartbeatAgeMs < 120_000;
      if (
        !locked &&
        !heartbeatFresh &&
        (currentLifecyclePhase.endsWith('_RUNNING') || currentLifecyclePhase === 'MONITORING')
      ) {
        setTimeout(() => {
          CompanyPipelineEngine.runPipeline(projectId).catch((err) => {
            console.warn('[Pipeline Status] ensure-running failed:', err);
          });
        }, 0);
      }
    }

    const department =
      (typeof genMeta.generationDepartment === 'string' && genMeta.generationDepartment) ||
      (pausedAt ? PIPELINE_PHASE_DEFINITIONS[pausedAt]?.department : undefined) ||
      PIPELINE_PHASE_DEFINITIONS[currentLifecyclePhase as ProjectLifecycleState]?.department;

    const liveGeneration = buildLiveGenerationState({
      lifecyclePhase: currentLifecyclePhase,
      phaseStatus: phaseStatus === 'failed' ? 'waiting' : phaseStatus,
      department,
      nextAction:
        (typeof genMeta.generationMessage === 'string' && genMeta.generationMessage) ||
        lifecycle?.nextAction ||
        null,
      heartbeatAt,
      lastError:
        currentLifecyclePhase === 'FAILED'
          ? lastGenerationError || {
              message: lifecycle?.nextAction || 'Generation stopped',
            }
          : lastGenerationError && phaseStatus === 'failed'
            ? lastGenerationError
            : null,
      regenerating: regenerating && phaseStatus === 'running',
    });

    // Force credit/error UX when FAILED
    if (currentLifecyclePhase === 'FAILED' && liveGeneration.kind === 'idle') {
      const classified = buildLiveGenerationState({
        lifecyclePhase: 'FAILED',
        phaseStatus: 'waiting',
        lastError: lastGenerationError || { message: lifecycle?.nextAction || 'Generation stopped' },
        nextAction: lifecycle?.nextAction,
        heartbeatAt,
      });
      Object.assign(liveGeneration, classified);
    }

    if (needsDevelopmentRegeneration) {
      Object.assign(liveGeneration, {
        kind: 'failed',
        tone: 'error',
        title: 'Development incomplete',
        message:
          fileEvidence?.message ||
          'No real project files in Explorer. Resume to regenerate Development.',
        canRetry: true,
        actionLabel: 'Resume Development',
      });
    }

    const timeline = (await getTimelineEvents({ limit: 40 })).filter((e) => {
      const meta = e.metadata as { projectId?: string } | undefined;
      return !meta?.projectId || meta.projectId === projectId;
    });

    // Drop stale Sync spam from in-memory workspace feed
    if (Array.isArray(workspaceState.activityFeed)) {
      workspaceState.activityFeed = workspaceState.activityFeed.filter(
        (item) => !String(item.message || '').startsWith('Sync '),
      );
    }

    const phases = ALL_PHASES.map((p) => ({
      id: p.id,
      name: p.name,
      status: getPhaseStatus(p.id, currentPhaseId, currentLifecyclePhase),
      agentRole: p.agentRole,
      progress: p.id === currentPhaseId && lifecycle ? lifecycle.progress : undefined,
    }));

    const employees = buildEmployees(currentPhaseId, phaseStatus);
    const activities = buildActivityLines(
      currentLifecyclePhase,
      currentPhaseId,
      phaseStatus,
      workspaceState.activityFeed as any,
      timeline,
    );

    const approvalRequests = waitingApprovals.map((wa, idx) => ({
      id: `approval_${idx}`,
      title: wa,
      description: 'Read the generated document below, then approve to continue the pipeline.',
      requestedBy: 'AI Pipeline',
      artifactName: wa,
      urgency: 'normal' as const,
    }));

    // Document the user must review before approving
    let pendingDocument: {
      title: string;
      type: string;
      summary?: string;
      producedBy?: string;
      content: unknown;
    } | null = null;

    if (waitingApprovals.length > 0 || phaseStatus === 'approval') {
      const pausedPhase =
        (lifecycle?.pausedAtPhase as ProjectLifecycleState | undefined) ||
        (currentLifecyclePhase === 'PAUSED' ? undefined : (currentLifecyclePhase as ProjectLifecycleState));

      let artifactType =
        (lifecycle as { currentArtifact?: string } | null)?.currentArtifact ||
        (pausedPhase ? PIPELINE_PHASE_DEFINITIONS[pausedPhase]?.outputArtifactType : undefined);

      if (!artifactType) {
        // Infer from approval gate name
        const gate = waitingApprovals[0] || '';
        const gateMap: Record<string, string> = {
          'Product Approval': 'ProductProposal',
          'Architecture Approval': 'ArchitectureDocument',
          'Design Approval': 'DesignSpecification',
          'QA Approval': 'QualityReport',
          'Deployment Approval': 'DeploymentArtifact',
        };
        artifactType = gateMap[gate];
      }

      if (artifactType) {
        // HTML/CSS · Saved but Architect proposed Next.js → rewrite before user approves.
        if (
          artifactType === 'ArchitectureDocument' ||
          waitingApprovals.some((w) => /architecture/i.test(w))
        ) {
          try {
            const { regenerateArchitectureForConfirmedStack } = await import(
              '@/packages/agents/roles/architect/architect.service'
            );
            const fixed = await regenerateArchitectureForConfirmedStack(projectId);
            if (fixed) {
              /* content reloaded below */
            }
          } catch (err) {
            console.warn('[Pipeline Status] architecture stack heal failed:', err);
          }
        }

        const artRes = await ArtifactManager.getLatestArtifact(projectId, artifactType);
        const def = pausedPhase ? PIPELINE_PHASE_DEFINITIONS[pausedPhase] : undefined;
        const doc = await prisma.document.findFirst({
          where: {
            projectId,
            type: { in: [artifactType, 'SYSTEM_ARCHITECTURE'] },
          },
          orderBy: { createdAt: 'desc' },
        });

        let content: unknown = artRes.success ? artRes.data : null;
        if (content == null && doc?.content) {
          try {
            content = JSON.parse(doc.content);
          } catch {
            content = doc.content;
          }
        }

        // Prefer full ArchitectAnalysis shape if we only have architecture slice
        if (
          content &&
          typeof content === 'object' &&
          !('architecture' in (content as object)) &&
          artifactType === 'ArchitectureDocument'
        ) {
          const dbDoc = await prisma.document.findFirst({
            where: { projectId, type: 'DATABASE_DESIGN' },
            orderBy: { createdAt: 'desc' },
          });
          const apiDoc = await prisma.document.findFirst({
            where: { projectId, type: 'API_SPECIFICATION' },
            orderBy: { createdAt: 'desc' },
          });
          let database: unknown = [];
          let api: unknown = { endpoints: [] };
          try {
            if (dbDoc?.content) database = JSON.parse(dbDoc.content);
          } catch {
            database = dbDoc?.content;
          }
          try {
            if (apiDoc?.content) api = JSON.parse(apiDoc.content);
          } catch {
            api = apiDoc?.content;
          }
          content = { architecture: content, database, api, decisions: [] };
        }

        pendingDocument = {
          title: doc?.title || `${artifactType.replace(/([A-Z])/g, ' $1').trim()}`,
          type: artifactType,
          summary: def
            ? `${def.department} finished this deliverable and is waiting for your approval.`
            : 'Generated deliverable ready for your review.',
          producedBy: def?.agentRole || doc?.author || 'AI Agent',
          content,
        };
      }
    }

    // Persist reopenable approved docs (content, not name stubs)
    const artifacts = (
      await Promise.all(
        completedPhases.map(async (phase, idx) => {
          const def = PIPELINE_PHASE_DEFINITIONS[phase as ProjectLifecycleState];
          if (!def?.outputArtifactType) return null;

          const artType = def.outputArtifactType;
          const [artRes, doc] = await Promise.all([
            ArtifactManager.getLatestArtifact(projectId, artType),
            prisma.document.findFirst({
              where: { projectId, type: artType },
              orderBy: { createdAt: 'desc' },
            }),
          ]);

          let content: unknown = artRes.success ? artRes.data : null;
          if (content == null && doc?.content) {
            try {
              content = JSON.parse(doc.content);
            } catch {
              content = doc.content;
            }
          }

          const prettyName = artType.replace(/([A-Z])/g, ' $1').trim();
          return {
            id: doc?.id || `artifact_${idx}_${artType}`,
            name: doc?.title || prettyName,
            type: artType,
            createdBy: def.agentRole || doc?.author || `${def.department} Agent`,
            createdAt: doc?.createdAt?.toISOString?.() || new Date().toISOString(),
            status: 'approved' as const,
            score: 90,
            summary: `${def.department} deliverable — reopen anytime`,
            producedBy: def.agentRole || doc?.author || `${def.department} Agent`,
            content,
          };
        }),
      )
    ).filter(Boolean);

    const healthScore =
      currentLifecyclePhase === 'FAILED' ? 45 : currentLifecyclePhase === 'COMPLETED' ? 100 : 92;

    // Token / credit meter data
    let usage = {
      totalTokens: 0,
      totalCostUsd: 0,
      sessionTokens: 0,
      sessionCostUsd: 0,
    };
    try {
      const all = await getUsageStats({ projectId });
      const sessionStart =
        typeof genMeta.sessionStartedAt === 'string'
          ? new Date(String(genMeta.sessionStartedAt))
          : new Date(Date.now() - 6 * 60 * 60 * 1000);
      const session = await getUsageStats({ projectId, since: sessionStart });
      usage = {
        totalTokens: all.totalTokens,
        totalCostUsd: all.totalCostUsd,
        sessionTokens: session.totalTokens,
        sessionCostUsd: session.totalCostUsd,
      };
    } catch {
      /* usage optional */
    }

    const creditSnap = await getProjectCreditSnapshot(projectId).catch(() => null);
    const credits = creditSnap
      ? {
          balance: creditSnap.balance,
          monthlyLimit: creditSnap.monthlyLimit,
          source: creditSnap.source,
          lowBalance: creditSnap.lowBalance,
        }
      : null;
    const strictMode = creditSnap?.strictMode ?? false;

    const artifactTypes = Array.from(
      new Set(
        [
          ...artifacts.map((a) => a?.type).filter(Boolean),
          pendingDocument?.type,
        ].filter((t): t is string => typeof t === 'string' && t.length > 0),
      ),
    );
    const blockedPhase =
      (typeof genMeta.resumePhase === 'string' && genMeta.resumePhase) ||
      (typeof genMeta.generationPhase === 'string' && genMeta.generationPhase) ||
      null;
    const deliverableChecklist = buildDeliverableChecklistForState({
      lifecyclePhase: currentLifecyclePhase,
      blockedPhase:
        currentLifecyclePhase === 'FAILED' || phaseStatus === 'failed'
          ? blockedPhase
          : null,
      completedPhases,
      artifactTypes,
    });

    // Before → after diff after regenerate
    let revisionDiff: {
      title: string;
      feedback?: string;
      before: unknown;
      after: unknown;
    } | null = null;
    const beforeSnap = genMeta.revisionBefore as
      | { type?: string; title?: string; content?: unknown; feedback?: string }
      | undefined;
    if (
      pendingDocument &&
      beforeSnap?.content != null &&
      (phaseStatus === 'approval' || regenerating)
    ) {
      revisionDiff = {
        title: beforeSnap.title || pendingDocument.title,
        feedback: beforeSnap.feedback,
        before: beforeSnap.content,
        after: pendingDocument.content,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPhase: currentPhaseId,
        phaseStatus,
        progress: displayProgress,
        lifecyclePhase: currentLifecyclePhase,
        canStart: currentLifecyclePhase === 'CREATED' && phaseStatus === 'waiting',
        healthScore,
        timeElapsed: 'In progress',
        phases,
        employees,
        activities,
        artifacts,
        approvalRequests,
        pendingDocument,
        liveGeneration,
        usage,
        credits,
        strictMode,
        deliverableChecklist,
        revisionDiff,
        needsDevelopmentRegeneration,
        fileEvidence: fileEvidence
          ? {
              fileCount: fileEvidence.fileCount,
              realFileCount: fileEvidence.realFileCount,
              hasAppEntry: fileEvidence.hasAppEntry,
              ok: fileEvidence.ok,
            }
          : null,
        deliveryPlan: await (async () => {
          try {
            const { loadDeliveryPlan, progressFromPlan } = await import(
              '@/core/company-orchestration/implementation-todo.store'
            );
            const plan = await loadDeliveryPlan(projectId);
            if (!plan) return null;
            return {
              fileStructure: plan.fileStructure,
              implementationTodos: plan.implementationTodos,
              qaTodos: plan.qaTodos,
              progress: progressFromPlan(plan),
            };
          } catch {
            return null;
          }
        })(),
      },
    });
  } catch (error: any) {
    console.error('[Pipeline Status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error?.message || 'Failed to get pipeline status', code: 'INTERNAL_ERROR' },
      },
      { status: 500 },
    );
  }
}
