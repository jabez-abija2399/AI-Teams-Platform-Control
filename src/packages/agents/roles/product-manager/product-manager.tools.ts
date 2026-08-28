/**
 * @file product-manager.tools.ts
 * @package @ai-teams/agents/roles/product-manager
 * @description Requirement refinement and user story breakdown tools for the Product Manager Agent.
 */

import type { ITool, ToolResult } from '@/packages/agents/tools/tool.interface';
import { aiCall } from '@/packages/agents/core/ai-call';
import { PRODUCT_MANAGER_SYSTEM_PROMPT } from './product-manager.prompt';
import {
  refinedRequirementsSchema,
  type RefinedRequirements,
} from './product-manager.types';
import type { CEOAnalysis } from '../ceo/ceo.types';

import { productManagerConfig } from '@/packages/agents/roles/product-manager/product-manager.config';

export const requirementRefinementTool: ITool<{
  ceoAnalysis: CEOAnalysis;
  projectId?: string;
  agentId?: string;
  revisionFeedback?: string;
}, RefinedRequirements> = {
  name: 'requirement_refinement',
  description: 'Refines CEO AI raw vision into precise, actionable specifications with acceptance criteria.',
  async execute({ ceoAnalysis, projectId, agentId, revisionFeedback }): Promise<ToolResult<RefinedRequirements>> {
    try {
      const feedbackPrompt = revisionFeedback ? `\n\nUser Revision Feedback to incorporate: "${revisionFeedback}"` : '';
      const raw = await aiCall<unknown>(
        `CEO Analysis:\n${JSON.stringify(ceoAnalysis, null, 2)}${feedbackPrompt}\n\nRefine these into precise, actionable requirements. Produce JSON with these EXACT keys:\n- userStories: array of objects {id: string, title: string, asA: string, iWant: string, soThat: string, acceptanceCriteria: string[], priority: string, estimatedEffort: string}\n- edgeCases: string[]\n- mvpFeatures: string[]\n- deferredFeatures: string[]\n- riskAnalysis: array of objects {risk: string, mitigation: string}\n\nRespond ONLY with valid JSON.`,
        PRODUCT_MANAGER_SYSTEM_PROMPT,
        'PRODUCT_MANAGER',
        productManagerConfig,
        projectId,
        agentId,
      );
      const data = refinedRequirementsSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Requirement refinement failed',
      };
    }
  },
};

export class ProductManagerTools {
  public static async breakdownFeatures(projectName: string, vision: string): Promise<string[]> {
    return [
      `Feature 1: Interactive Main Workspace for ${projectName}`,
      `Feature 2: Real-time telemetry and data visualizations`,
      `Feature 3: Responsive settings & preferences management`,
    ];
  }
}
