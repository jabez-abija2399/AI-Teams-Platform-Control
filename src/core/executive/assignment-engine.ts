import type { ExecutiveTask, AgentWorkload } from './types';
import { CapabilityMatcherService } from '../workforce/capability/capability-matcher.service';

export class AssignmentEngine {
  /**
   * Selects best assigned agent and reviewer agent based on domain capability & workload
   */
  public static assignTask(taskTitle: string, taskDescription: string): { assignedAgent: string; reviewerAgent: string } {
    const match = CapabilityMatcherService.matchTask({ title: taskTitle, description: taskDescription });
    return {
      assignedAgent: match.primaryAgent,
      reviewerAgent: match.supportingReviewer,
    };
  }

  /**
   * Computes workload metrics for all AI employees
   */
  public static calculateWorkloads(tasks: ExecutiveTask[]): AgentWorkload[] {
    const roles = [
      { role: 'CEO', name: 'Chief Executive AI' },
      { role: 'PRODUCT_MANAGER', name: 'Lead PM AI' },
      { role: 'ARCHITECT', name: 'Principal Architect AI' },
      { role: 'DATABASE', name: 'Database Specialist AI' },
      { role: 'DEVELOPER', name: 'Lead Developer AI' },
      { role: 'FRONTEND', name: 'Frontend Lead AI' },
      { role: 'QA', name: 'QA Specialist AI' },
    ];

    return roles.map(({ role, name }) => {
      const assigned = tasks.filter((t) => t.assignedAgent.toUpperCase() === role.toUpperCase());
      const active = assigned.filter((t) => t.status === 'in_progress' || t.status === 'pending');
      const workloadPercentage = Math.min(100, Math.round((assigned.length / Math.max(1, tasks.length)) * 100 * 3));

      return {
        agentRole: role,
        agentName: name,
        assignedTaskCount: assigned.length,
        activeTasks: active.map((t) => t.title),
        workloadPercentage,
      };
    });
  }
}
