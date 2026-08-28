/**
 * @file qa-engineer.agent.ts
 * @package @ai-teams/agents/roles/qa-engineer
 * @description QA & Test Automation Engineer Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { QAVerificationReportSchema, type QAVerificationReport } from '../../contracts/deliverable-schemas';
import { QaEngineerService } from './qa-engineer.service';

export class QaEngineerAgent extends BaseAgent<QAVerificationReport> {
  public readonly roleId = 'qa-engineer';
  public readonly displayName = 'Lead QA & Test Automation Engineer';
  public readonly department = 'Quality Assurance & Security';
  public readonly deliverableType = 'QAVerificationReport';

  public readonly contract: AgentContract = {
    role: 'qa-engineer',
    department: 'Quality Assurance & Security',
    description: 'Runs test assertions, validates schema integrity, and issues release readiness reports.',
    allowedTools: ['test_runner', 'syntax_checker', 'defect_tracker'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'QAVerificationReport',
    schema: QAVerificationReportSchema,
    qualityThresholdPercent: 98,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<QAVerificationReport>> {
    const startTime = Date.now();
    this.log('Auditing code quality and running test suites...', { projectId: context.projectId });

    try {
      const report = await QaEngineerService.runVerification({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: report,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as QAVerificationReport,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'QA execution failed',
      };
    }
  }
}

/**
 * @legacy QAAgent — backwards-compatible alias for tests expecting role='QA'.
 */
export class QAAgent extends QaEngineerAgent {
  constructor(name = 'Quality Assurance Engineer') {
    super();
    (this as any)._role = 'QA';
    (this as any)._name = name;
  }

  override get role(): any { return 'QA'; }
  override get name(): string { return (this as any)._name; }
}

