/**
 * @file ui-designer.agent.ts
 * @package @ai-teams/agents/roles/ui-designer
 * @description Lead UI/UX Designer Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { UIDesignSpecSchema, type UIDesignSpec } from '../../contracts/deliverable-schemas';
import { UIDesignerService } from './ui-designer.service';

export class UIDesignerAgent extends BaseAgent<UIDesignSpec> {
  public readonly roleId = 'ui-designer';
  public readonly displayName = 'Lead UI/UX Designer';
  public readonly department = 'Design & User Experience';
  public readonly deliverableType = 'UIDesignSpec';

  public readonly contract: AgentContract = {
    role: 'ui-designer',
    department: 'Design & User Experience',
    description: 'Establishes color tokens, typography, component hierarchies, and responsive styling.',
    allowedTools: ['theme_token_builder', 'layout_specifier'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'UIDesignSpec',
    schema: UIDesignSpecSchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<UIDesignSpec>> {
    const startTime = Date.now();
    this.log('Designing visual system and UI tokens...', { projectId: context.projectId });

    try {
      const designSpec = await UIDesignerService.designUi({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: designSpec,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as UIDesignSpec,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'UI Designer execution failed',
      };
    }
  }
}
