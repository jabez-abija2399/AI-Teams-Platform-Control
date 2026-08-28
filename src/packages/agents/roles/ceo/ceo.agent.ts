/**
 * @file ceo.agent.ts
 * @package @ai-teams/agents/roles/ceo
 * @description Chief Executive Officer (CEO) Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { BusinessStrategySchema, type BusinessStrategy } from '../../contracts/deliverable-schemas';
import { CeoService } from './ceo.service';

export class CeoAgent extends BaseAgent<BusinessStrategy> {
  public readonly roleId = 'ceo';
  public readonly displayName = 'Chief Executive Officer (CEO)';
  public readonly department = 'Executive & Strategy';
  public readonly deliverableType = 'BusinessStrategy';

  public readonly contract: AgentContract = {
    role: 'ceo',
    department: 'Executive & Strategy',
    description: 'Formulates market strategy, MVP boundaries, and value proposition.',
    allowedTools: ['market_research', 'scope_estimation'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'BusinessStrategy',
    schema: BusinessStrategySchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<BusinessStrategy>> {
    const startTime = Date.now();
    this.log('Formulating business strategy...', { projectId: context.projectId });

    try {
      const strategy = await CeoService.formulateStrategy({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: strategy,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as BusinessStrategy,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'CEO execution failed',
      };
    }
  }
}
