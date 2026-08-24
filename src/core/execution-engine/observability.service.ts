import { prisma } from '@/lib/prisma';
import { PIPELINE_PHASE_DEFINITIONS, type ProjectLifecycleState } from '@/core/company-orchestration/types';
import { findWorkflowScalars } from '@/core/company-orchestration/workflow-state-access';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';

export class ObservabilityService {
  async getProjectDashboard(projectId: string) {
    const workflowState = await findWorkflowScalars(projectId);
    const statusRes = await WorkflowManager.getOrInitState(projectId);
    const full = statusRes.success ? statusRes.data : null;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectExecutions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            tasks: true
          }
        }
      }
    });

    if (!project) throw new Error('Project not found');

    const execution = project.projectExecutions[0];
    const tasks = execution?.tasks || [];
    
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const activeTasks = tasks.filter((t: any) => t.status === 'RUNNING' || t.status === 'CLAIMED').length;
    const totalTasks = tasks.length;
    const progress = workflowState ? workflowState.progress : (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);

    const activeAgents = workflowState && workflowState.activeAgent
      ? [workflowState.activeAgent]
      : [...new Set(tasks.filter((t: any) => t.status === 'RUNNING' || t.status === 'CLAIMED').map((t: any) => t.agentRole))];

    const currentPhase = workflowState ? workflowState.currentPhase : project.status;
    const currentDepartment = workflowState
      ? PIPELINE_PHASE_DEFINITIONS[workflowState.currentPhase as ProjectLifecycleState]?.department || 'Company Operations'
      : 'Intake';

    return {
      status: workflowState?.currentPhase === 'PAUSED' ? 'PAUSED' : workflowState?.currentPhase === 'COMPLETED' ? 'COMPLETED' : (execution?.status || 'IDLE'),
      currentPhase,
      activeAgents,
      completedTasks: full && full.completedPhases.length > 0 ? full.completedPhases.length : completedTasks,
      remainingTasks: full && full.completedPhases.length > 0 ? Math.max(0, 13 - full.completedPhases.length) : totalTasks - completedTasks,
      progress,
      currentDepartment,
      currentArtifact: workflowState?.currentArtifact || null,
      nextAction: workflowState?.nextAction || 'Awaiting task...',
      waitingApprovals: full?.waitingApprovals || [],
      risks: full?.risks || [],
    };
  }

  async getAgentAnalytics(projectId: string) {
    const runs = await prisma.agentRun.findMany({
      where: { task: { execution: { projectId } } },
      include: { task: true }
    });

    const agentStats: Record<string, any> = {};

    runs.forEach(run => {
      if (!agentStats[run.agentRole]) {
        agentStats[run.agentRole] = {
          role: run.agentRole,
          tasksCompleted: 0,
          successCount: 0,
          totalCount: 0,
          totalDuration: 0,
          totalTokens: 0,
        };
      }
      
      const stat = agentStats[run.agentRole];
      stat.totalCount++;
      if (run.status === 'SUCCESS') stat.successCount++;
      if (run.task.status === 'COMPLETED') stat.tasksCompleted++; // rough estimate
      stat.totalDuration += (run.duration || 0);
      stat.totalTokens += (run.promptTokens + run.completionTokens);
    });

    return Object.values(agentStats).map((stat: any) => ({
      role: stat.role,
      tasksCompleted: stat.tasksCompleted,
      successRate: stat.totalCount > 0 ? (stat.successCount / stat.totalCount) * 100 : 0,
      averageDuration: stat.totalCount > 0 ? stat.totalDuration / stat.totalCount : 0,
      tokenUsage: stat.totalTokens,
      cost: (stat.totalTokens / 1000) * 0.02 // mock calculation
    }));
  }

  async getExecutionTimeline(projectId: string) {
    const events = await prisma.executionEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return events.map(e => ({
      id: e.id,
      type: e.type,
      message: e.creatorMessage,
      timestamp: e.createdAt,
    }));
  }
}

let instance: ObservabilityService | null = null;
export function getObservabilityService() {
  if (!instance) instance = new ObservabilityService();
  return instance;
}
