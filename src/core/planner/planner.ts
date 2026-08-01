import { SoftwareRequirementsSpecification } from '../specification/types';
import { ExecutionPlan, PlannedTask, Milestone } from './types';

export class AutonomousProjectPlanner {
  /**
   * Generates a complete execution plan and DAG from an SRS specification
   */
  public static async generateExecutionPlan(
    spec: SoftwareRequirementsSpecification
  ): Promise<ExecutionPlan> {
    const requiredAgents = [
      'CEO AI',
      'Product Manager',
      'System Architect',
      'DB Architect',
      'Backend Engineer',
      'Frontend Lead',
      'QA Automation',
      'SecOps Lead',
      'DevOps Engine',
    ];

    const requiredDbTables = spec.databaseRequirements.map((d) => d.tableName);
    const requiredApis = spec.apiRequirements.map((a) => `${a.method} ${a.endpoint}`);
    const requiredComponents = spec.functionalRequirements.map((f) => `${f.title}Component`);

    const tasks: PlannedTask[] = [
      {
        id: 'TASK-101',
        title: 'Formulate Architecture & Tech Stack',
        assignedAgent: 'System Architect',
        dependencies: [],
        estimatedDurationHours: 4,
        taskType: 'ARCHITECTURE',
        isParallelAllowed: false,
      },
      {
        id: 'TASK-102',
        title: 'Design Database Schema & Relational Models',
        assignedAgent: 'DB Architect',
        dependencies: ['TASK-101'],
        estimatedDurationHours: 6,
        taskType: 'DATABASE',
        isParallelAllowed: false,
      },
      {
        id: 'TASK-103',
        title: 'Implement REST API Endpoints & Handlers',
        assignedAgent: 'Backend Engineer',
        dependencies: ['TASK-102'],
        estimatedDurationHours: 16,
        taskType: 'BACKEND',
        isParallelAllowed: true,
      },
      {
        id: 'TASK-104',
        title: 'Develop Responsive UI Layouts & Design System',
        assignedAgent: 'Frontend Lead',
        dependencies: ['TASK-101'],
        estimatedDurationHours: 18,
        taskType: 'FRONTEND',
        isParallelAllowed: true,
      },
      {
        id: 'TASK-105',
        title: 'Execute Automated Vitest Test Suite & QA',
        assignedAgent: 'QA Automation',
        dependencies: ['TASK-103', 'TASK-104'],
        estimatedDurationHours: 8,
        taskType: 'QA',
        isParallelAllowed: false,
      },
      {
        id: 'TASK-106',
        title: 'Run OWASP Security Scan & Input Validation',
        assignedAgent: 'SecOps Lead',
        dependencies: ['TASK-105'],
        estimatedDurationHours: 4,
        taskType: 'SECURITY',
        isParallelAllowed: false,
      },
      {
        id: 'TASK-107',
        title: 'Provision Cloud Sandbox & Deploy Web Application',
        assignedAgent: 'DevOps Engine',
        dependencies: ['TASK-106'],
        estimatedDurationHours: 6,
        taskType: 'DEPLOYMENT',
        isParallelAllowed: false,
      },
    ];

    const dagEdges = [
      { from: 'TASK-101', to: 'TASK-102' },
      { from: 'TASK-101', to: 'TASK-104' },
      { from: 'TASK-102', to: 'TASK-103' },
      { from: 'TASK-103', to: 'TASK-105' },
      { from: 'TASK-104', to: 'TASK-105' },
      { from: 'TASK-105', to: 'TASK-106' },
      { from: 'TASK-106', to: 'TASK-107' },
    ];

    const milestones: Milestone[] = [
      {
        id: 'M-1',
        title: 'Architecture & Database Initialization',
        description: 'Schema & System Specs Approved',
        targetDay: 2,
        associatedTaskIds: ['TASK-101', 'TASK-102'],
      },
      {
        id: 'M-2',
        title: 'Core Backend & Frontend Implementation',
        description: 'Full Stack Functional Application Built',
        targetDay: 5,
        associatedTaskIds: ['TASK-103', 'TASK-104'],
      },
      {
        id: 'M-3',
        title: 'Production Verification & Live Launch',
        description: 'Passed QA, Security, and Live Cloud Deploy',
        targetDay: spec.estimatedTimelineDays,
        associatedTaskIds: ['TASK-105', 'TASK-106', 'TASK-107'],
      },
    ];

    return {
      projectId: spec.projectId,
      specificationId: spec.id,
      complexity: spec.estimatedComplexity,
      estimatedDays: spec.estimatedTimelineDays,
      estimatedBudgetUSD: spec.estimatedCostUSD,
      requiredAgents,
      requiredDbTables,
      requiredApis,
      requiredComponents,
      criticalPath: ['TASK-101', 'TASK-102', 'TASK-103', 'TASK-105', 'TASK-106', 'TASK-107'],
      tasks,
      dagEdges,
      milestones,
      sprintPlan: [
        { sprintNumber: 1, goal: 'Architecture & Foundation', taskIds: ['TASK-101', 'TASK-102'] },
        { sprintNumber: 2, goal: 'Feature Development', taskIds: ['TASK-103', 'TASK-104'] },
        { sprintNumber: 3, goal: 'Quality & Cloud Launch', taskIds: ['TASK-105', 'TASK-106', 'TASK-107'] },
      ],
    };
  }
}
