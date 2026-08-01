import { prisma } from '@/lib/prisma';
import type { Milestone, WorkPackage, ExecutiveTask } from './types';
import { AssignmentEngine } from './assignment-engine';
import { DependencyEngine } from './dependency-engine';
import { ProgressEngine } from './progress-engine';

const inMemoryMilestones = new Map<string, Milestone[]>();
const inMemoryWorkPackages = new Map<string, WorkPackage[]>();
const inMemoryTasks = new Map<string, ExecutiveTask[]>();

export class ExecutivePlanner {
  /**
   * Initializes or replans project work hierarchy (Milestones -> Work Packages -> Tasks)
   */
  public static async planProjectWork(projectId: string): Promise<{
    milestones: Milestone[];
    workPackages: WorkPackage[];
    tasks: ExecutiveTask[];
  }> {
    if (inMemoryMilestones.has(projectId)) {
      return {
        milestones: inMemoryMilestones.get(projectId)!,
        workPackages: inMemoryWorkPackages.get(projectId)!,
        tasks: inMemoryTasks.get(projectId)!,
      };
    }

    const m1: Milestone = {
      id: `ms_1`,
      projectId,
      title: 'Milestone 1: Strategic Alignment & Architecture Authorization',
      description: 'Formalize vision, requirements, product proposal, and technical architecture.',
      priority: 'critical',
      estimatedDuration: '1 Day',
      dependencies: [],
      completionPercentage: 100,
      status: 'completed',
    };

    const m2: Milestone = {
      id: `ms_2`,
      projectId,
      title: 'Milestone 2: Data Modeling & Persistence Layer',
      description: 'Define entity schemas, Prisma relations, and database migration scripts.',
      priority: 'high',
      estimatedDuration: '2 Days',
      dependencies: ['ms_1'],
      completionPercentage: 40,
      status: 'in_progress',
    };

    const m3: Milestone = {
      id: `ms_3`,
      projectId,
      title: 'Milestone 3: Core API Services & Frontend Workspace',
      description: 'Implement server controllers, API endpoints, and Mission Control UI.',
      priority: 'high',
      estimatedDuration: '3 Days',
      dependencies: ['ms_2'],
      completionPercentage: 0,
      status: 'pending',
    };

    const milestones = [m1, m2, m3];

    // Work Packages
    const wp1: WorkPackage = {
      id: `wp_1`,
      projectId,
      milestoneId: 'ms_1',
      objective: 'Validate product specifications and approve architecture stack',
      ownerAgent: 'ARCHITECT',
      estimatedEffort: '4 Hours',
      dependencies: [],
      risks: ['Scope creep in initial requirements'],
      deliverables: ['Product Proposal', 'Architecture Proposal Card'],
    };

    const wp2: WorkPackage = {
      id: `wp_2`,
      projectId,
      milestoneId: 'ms_2',
      objective: 'Construct relational database schema and run migrations',
      ownerAgent: 'DATABASE',
      estimatedEffort: '6 Hours',
      dependencies: ['wp_1'],
      risks: ['Foreign key constraint conflicts'],
      deliverables: ['Prisma Schema', 'DB Migration Scripts'],
    };

    const workPackages = [wp1, wp2];

    // Tasks
    const t1: ExecutiveTask = {
      id: `tsk_1`,
      projectId,
      workPackageId: 'wp_1',
      title: 'Define Architecture Tech Stack & Quality Scoring',
      description: 'Select framework, database, and evaluate scalability score.',
      assignedAgent: 'ARCHITECT',
      reviewerAgent: 'CEO',
      priority: 'critical',
      status: 'completed',
      estimatedTime: '2 Hours',
      actualTime: '1.5 Hours',
      blockers: [],
      dependencyChain: [],
      completionPercentage: 100,
    };

    const t2: ExecutiveTask = {
      id: `tsk_2`,
      projectId,
      workPackageId: 'wp_2',
      title: 'Create Prisma Models & Migration Push',
      description: 'Draft database models for memory, workspace state, and milestone planning.',
      assignedAgent: 'DATABASE',
      reviewerAgent: 'ARCHITECT',
      priority: 'high',
      status: 'in_progress',
      estimatedTime: '3 Hours',
      blockers: [],
      dependencyChain: ['tsk_1'],
      completionPercentage: 50,
    };

    const t3: ExecutiveTask = {
      id: `tsk_3`,
      projectId,
      workPackageId: 'wp_2',
      title: 'Implement API Routes for Executive Work Management',
      description: 'Create REST endpoints for milestones, tasks, and project health dashboard.',
      assignedAgent: 'DEVELOPER',
      reviewerAgent: 'ARCHITECT',
      priority: 'medium',
      status: 'pending',
      estimatedTime: '3 Hours',
      blockers: [],
      dependencyChain: ['tsk_2'],
      completionPercentage: 0,
    };

    const tasks = DependencyEngine.evaluateDependencies([t1, t2, t3]);

    inMemoryMilestones.set(projectId, milestones);
    inMemoryWorkPackages.set(projectId, workPackages);
    inMemoryTasks.set(projectId, tasks);

    return { milestones, workPackages, tasks };
  }

  /**
   * Automatic Replanning when requirements or decisions change
   */
  public static async replan(projectId: string, reason: string): Promise<{
    milestones: Milestone[];
    workPackages: WorkPackage[];
    tasks: ExecutiveTask[];
  }> {
    const current = await this.planProjectWork(projectId);

    // Create a new dynamic replanned task
    const newTaskId = `tsk_replan_${Date.now()}`;
    const assignInfo = AssignmentEngine.assignTask(reason, reason);

    const replannedTask: ExecutiveTask = {
      id: newTaskId,
      projectId,
      workPackageId: current.workPackages[0]?.id || 'wp_1',
      title: `Replanned Task: Adapt to "${reason.substring(0, 40)}"`,
      description: `Automatically generated task following change request: ${reason}`,
      assignedAgent: assignInfo.assignedAgent,
      reviewerAgent: assignInfo.reviewerAgent,
      priority: 'high',
      status: 'pending',
      estimatedTime: '2 Hours',
      blockers: [],
      dependencyChain: [current.tasks[0]?.id || 'tsk_1'],
      completionPercentage: 0,
    };

    const updatedTasks = DependencyEngine.evaluateDependencies([...current.tasks, replannedTask]);
    inMemoryTasks.set(projectId, updatedTasks);

    return {
      milestones: current.milestones,
      workPackages: current.workPackages,
      tasks: updatedTasks,
    };
  }
}
