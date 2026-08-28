/**
 * @file developer.agent.ts
 * @package @ai-teams/agents/roles/developer
 * @description Fullstack Developer Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { ImplementationDeliverableSchema, type ImplementationDeliverable } from '../../contracts/deliverable-schemas';
import { DeveloperService } from './developer.service';

export class DeveloperAgent extends BaseAgent<ImplementationDeliverable> {
  public readonly roleId = 'developer';
  public readonly displayName = 'Lead Software Engineer';
  public readonly department = 'Engineering & Development';
  public readonly deliverableType = 'ImplementationDeliverable';

  public readonly contract: AgentContract = {
    role: 'developer',
    department: 'Engineering & Development',
    description: 'Implements production code files, components, and API routes with zero placeholders.',
    allowedTools: ['file_writer', 'file_reader', 'ast_modifier'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'ImplementationDeliverable',
    schema: ImplementationDeliverableSchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<ImplementationDeliverable>> {
    const startTime = Date.now();
    this.log('Implementing software files...', { projectId: context.projectId });

    try {
      const deliverable = await DeveloperService.generateCode({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: deliverable,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as ImplementationDeliverable,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Developer execution failed',
      };
    }
  }
}
