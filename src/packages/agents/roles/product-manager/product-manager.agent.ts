/**
 * @file product-manager.agent.ts
 * @package @ai-teams/agents/roles/product-manager
 * @description Product Manager Agent class implementing BaseAgent.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from '../../core/base-agent';
import type { AgentContract } from '../../contracts/agent-contract.interface';
import { ProductRequirementsDocSchema, type ProductRequirementsDoc } from '../../contracts/deliverable-schemas';
import { ProductManagerService } from './product-manager.service';

export class ProductManagerAgent extends BaseAgent<ProductRequirementsDoc> {
  public readonly roleId = 'product-manager';
  public readonly displayName = 'Lead Product Manager (PM)';
  public readonly department = 'Product & Requirements';
  public readonly deliverableType = 'ProductRequirementsDoc';

  public readonly contract: AgentContract = {
    role: 'product-manager',
    department: 'Product & Requirements',
    description: 'Generates detailed user stories, acceptance criteria, and PRD specifications.',
    allowedTools: ['prd_generator', 'feature_breakdown'],
    requiredInputKeys: ['visionPrompt'],
    deliverableType: 'ProductRequirementsDoc',
    schema: ProductRequirementsDocSchema,
    qualityThresholdPercent: 95,
  };

  public async execute(context: AgentExecutionContext): Promise<AgentExecutionResult<ProductRequirementsDoc>> {
    const startTime = Date.now();
    this.log('Generating PRD...', { projectId: context.projectId });

    try {
      const prd = await ProductManagerService.generatePrd({
        projectId: context.projectId,
        projectName: context.projectName,
        visionPrompt: context.visionPrompt,
      });

      return {
        success: true,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: prd,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        agentRole: this.roleId,
        deliverableType: this.deliverableType,
        data: null as unknown as ProductRequirementsDoc,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Product Manager execution failed',
      };
    }
  }
}
