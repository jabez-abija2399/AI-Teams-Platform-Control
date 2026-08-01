import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import { PIPELINE_PHASE_DEFINITIONS } from '@/core/company-orchestration/types';
import type { ProjectLifecycleState } from '@/core/company-orchestration/types';

type PipelinePhaseId =
  | 'discovery' | 'clarification' | 'proposal' | 'strategy' | 'product'
  | 'architecture' | 'planning' | 'development' | 'testing' | 'review'
  | 'security' | 'deployment' | 'completed';

const LIFECYCLE_TO_PHASE_ID: Record<string, PipelinePhaseId> = {
  DISCOVERY_RUNNING: 'discovery',
  CLARIFICATION_RUNNING: 'clarification',
  PROPOSAL_RUNNING: 'proposal',
  STRATEGY_RUNNING: 'strategy',
  PRODUCT_RUNNING: 'product',
  ANALYSIS_RUNNING: 'development',
  DESIGN_RUNNING: 'architecture',
  ARCHITECTURE_RUNNING: 'architecture',
  PLANNING_RUNNING: 'planning',
  DEVELOPMENT_RUNNING: 'development',
  TESTING_RUNNING: 'development',
  REVIEW_RUNNING: 'review',
  SECURITY_RUNNING: 'development',
  DEPLOYMENT_RUNNING: 'deployment',
  COMPLETED: 'completed',
};

const ALL_PHASES: { id: PipelinePhaseId; name: string; agentRole: string }[] = [
  { id: 'discovery', name: 'Discovery', agentRole: 'CEO' },
  { id: 'clarification', name: 'Clarification', agentRole: 'Product Manager' },
  { id: 'proposal', name: 'Product Proposal', agentRole: 'Product Manager' },
  { id: 'strategy', name: 'Strategy', agentRole: 'CEO' },
  { id: 'product', name: 'Product Management', agentRole: 'Product Manager' },
  { id: 'architecture', name: 'Architecture', agentRole: 'Architect' },
  { id: 'planning', name: 'Planning', agentRole: 'CEO' },
  { id: 'development', name: 'Development', agentRole: 'Engineers' },
  { id: 'testing', name: 'Testing', agentRole: 'QA Engineer' },
  { id: 'review', name: 'Review', agentRole: 'Review Board' },
  { id: 'security', name: 'Security', agentRole: 'Security Engineer' },
  { id: 'deployment', name: 'Deployment', agentRole: 'DevOps' },
  { id: 'completed', name: 'Completed', agentRole: '' },
];

const ROLE_MAP: Record<string, { name: string; avatar: string; role: string }> = {
  PRODUCT_DISCOVERY: { name: 'CEO AI', avatar: '👔', role: 'Chief Executive' },
  CEO: { name: 'CEO AI', avatar: '👔', role: 'Chief Executive' },
  PRODUCT_MANAGER: { name: 'Product Manager', avatar: '📋', role: 'Product' },
  BUSINESS_ANALYST: { name: 'Business Analyst', avatar: '📊', role: 'Analysis' },
  UI_UX: { name: 'UI/UX Designer', avatar: '🎨', role: 'Design' },
  ARCHITECT: { name: 'Software Architect', avatar: '🏗️', role: 'Architecture' },
  OPERATIONS: { name: 'Operations AI', avatar: '⚙️', role: 'Operations' },
  DEVELOPER: { name: 'Developer AI', avatar: '💻', role: 'Engineering' },
  QA: { name: 'QA Engineer', avatar: '🧪', role: 'Quality' },
  REVIEWER: { name: 'Review Committee', avatar: '📝', role: 'Review' },
  SECURITY: { name: 'Security Engineer', avatar: '🔒', role: 'Security' },
  DEVOPS: { name: 'DevOps Engineer', avatar: '🚀', role: 'DevOps' },
};

function getPhaseStatus(
  phaseId: PipelinePhaseId,
  currentPhaseId: PipelinePhaseId,
  lifecyclePhase: string,
): 'completed' | 'active' | 'pending' | 'failed' {
  if (lifecyclePhase === 'FAILED') return 'failed';
  if (lifecyclePhase === 'COMPLETED' && phaseId === 'completed') return 'active';

  const phaseOrder = ALL_PHASES.map(p => p.id);
  const currentIdx = phaseOrder.indexOf(currentPhaseId);
  const phaseIdx = phaseOrder.indexOf(phaseId);

  if (phaseIdx < currentIdx) return 'completed';
  if (phaseIdx === currentIdx) return 'active';
  return 'pending';
}

export async function GET(
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

    // Get in-memory workspace state (employees, timeline, activities)
    const workspaceState = WorkspaceService.getWorkspaceState(projectId);

    // Get DB workflow state (current phase, completed phases, approvals)
    const lifecycleRes = await WorkflowManager.getOrInitState(projectId);
    const lifecycle = lifecycleRes.success ? lifecycleRes.data : null;

    const currentLifecyclePhase = lifecycle?.currentPhase || 'CREATED';
    const completedPhases: string[] = lifecycle?.completedPhases || [];
    const waitingApprovals: string[] = lifecycle?.waitingApprovals || [];

    // Map lifecycle phase to room phase ID
    const currentPhaseId = LIFECYCLE_TO_PHASE_ID[currentLifecyclePhase] || 'discovery';

    // Determine phase status
    let phaseStatus: 'running' | 'completed' | 'approval' | 'waiting' = 'waiting';
    if (currentLifecyclePhase === 'COMPLETED') {
      phaseStatus = 'completed';
    } else if (currentLifecyclePhase === 'PAUSED' || waitingApprovals.length > 0) {
      phaseStatus = 'approval';
    } else if (currentLifecyclePhase !== 'CREATED') {
      phaseStatus = 'running';
    }

    // Build phases list with statuses
    const phases = ALL_PHASES.map(p => ({
      id: p.id,
      name: p.name,
      status: getPhaseStatus(p.id, currentPhaseId, currentLifecyclePhase),
      agentRole: p.agentRole,
      progress: p.id === currentPhaseId && lifecycle ? lifecycle.progress : undefined,
    }));

    // Map workspace employees to frontend format
    const employees = workspaceState.employees.map(emp => {
      const roleInfo = ROLE_MAP[emp.role] || { name: emp.name, avatar: '🤖', role: emp.role };
      const isActive = emp.status === 'Working' || emp.status === 'Thinking';
      return {
        id: emp.id,
        name: roleInfo.name,
        role: roleInfo.role,
        avatar: roleInfo.avatar,
        status: isActive ? 'active' : emp.status === 'Completed' ? 'completed' : emp.status === 'Waiting User' ? 'waiting' : 'idle',
        currentTask: emp.currentTask !== 'Waiting for assignment...' && emp.currentTask !== 'Standing by.' ? emp.currentTask : undefined,
        confidence: emp.progress || undefined,
      };
    });

    // Map activity feed to frontend format
    const activities = workspaceState.activityFeed.slice(0, 50).map(item => {
      const roleInfo = ROLE_MAP[item.agentRole] || { name: item.agentName, avatar: '🤖', role: item.agentRole };
      let actionType = 'started';
      if (item.category === 'milestone') actionType = 'completed';
      else if (item.category === 'approval') actionType = 'approved';
      else if (item.message.toLowerCase().includes('created') || item.message.toLowerCase().includes('generated')) actionType = 'created';
      else if (item.message.toLowerCase().includes('review')) actionType = 'reviewed';
      else if (item.message.toLowerCase().includes('deploy')) actionType = 'deployed';

      return {
        id: item.id,
        agentName: roleInfo.name,
        agentAvatar: roleInfo.avatar,
        action: item.message,
        timestamp: item.timestamp || new Date().toISOString(),
        type: actionType,
      };
    });

    // Build approval requests
    const approvalRequests = waitingApprovals.map((wa, idx) => ({
      id: `approval_${idx}`,
      title: `Approve ${wa}`,
      description: 'The AI team has completed this phase and requires your approval to proceed.',
      requestedBy: 'AI Pipeline',
      artifactName: wa,
      urgency: 'normal' as const,
    }));

    // Build artifacts from completed phases
    const artifacts = completedPhases.map((phase, idx) => {
      const def = PIPELINE_PHASE_DEFINITIONS[phase as ProjectLifecycleState];
      if (!def) return null;
      return {
        id: `artifact_${idx}`,
        name: def.outputArtifactType || `${def.department} Output`,
        type: 'Document',
        createdBy: `${def.department} Agent`,
        createdAt: new Date().toISOString(),
        status: 'approved' as const,
        score: 90,
      };
    }).filter(Boolean);

    const healthScore = currentLifecyclePhase === 'FAILED' ? 45 : currentLifecyclePhase === 'COMPLETED' ? 100 : 92;

    return NextResponse.json({
      success: true,
      data: {
        currentPhase: currentPhaseId,
        phaseStatus,
        progress: lifecycle?.progress || workspaceState.overallProgress || 0,
        healthScore,
        timeElapsed: 'In progress',
        phases,
        employees,
        activities,
        artifacts,
        approvalRequests,
      },
    });
  } catch (error: any) {
    console.error('[Pipeline Status] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Failed to get pipeline status', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
