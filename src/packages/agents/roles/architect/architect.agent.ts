/**
 * @file architect.agent.ts
 * @package @ai-teams/agents/roles/architect
 * @description System Architect Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { ArchitectureSpecSchema, type ArchitectureSpec } from '../../contracts/deliverable-schemas';
import { ArchitectService } from './architect.service';

export class ArchitectAgent extends BaseAgent<ArchitectureSpec> {
  public readonly roleId = 'architect';
  public readonly displayName = 'Principal System Architect';
  public readonly department = 'Architecture & Systems';
  public readonly deliverableType = 'ArchitectureSpec';

  public readonly contract: AgentContract = {
    role: 'architect',
    department: 'Architecture & Systems',
    description: 'Designs complete file trees, database schemas, API contracts, and implementation blueprints.',
    allowedTools: ['tech_evaluator', 'schema_designer', 'api_contractor'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'ArchitectureSpec',
    schema: ArchitectureSpecSchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<ArchitectureSpec>> {
    const startTime = Date.now();
    this.log('Designing technical architecture...', { projectId: context.projectId });

    try {
      const spec = await ArchitectService.designArchitecture({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: spec,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as ArchitectureSpec,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Architect execution failed',
      };
    }
  }
}
