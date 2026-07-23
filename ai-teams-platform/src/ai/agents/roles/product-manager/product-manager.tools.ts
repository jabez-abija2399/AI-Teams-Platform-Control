import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { aiCall } from '@/ai/agents/core/ai-call';
import { productManagerConfig } from './product-manager.config';
import { PRODUCT_MANAGER_SYSTEM_PROMPT } from './product-manager.prompt';
import {
  refinedRequirementsSchema,
  type RefinedRequirements,
} from './product-manager.types';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

export const requirementRefinementTool: ITool<{
  ceoAnalysis: CEOAnalysis;
  projectId?: string;
  agentId?: string;
}, RefinedRequirements> = {
  name: 'requirement_refinement',
  description: 'Refines CEO AI raw vision into precise, actionable specifications with acceptance criteria.',
  async execute({ ceoAnalysis, projectId, agentId }): Promise<ToolResult<RefinedRequirements>> {
    try {
      const raw = await aiCall<unknown>(
        `CEO Analysis:\n${JSON.stringify(ceoAnalysis, null, 2)}\n\nRefine these into precise, actionable requirements. Produce JSON with these EXACT keys:\n- userStories: array of objects {id: string, title: string, asA: string, iWant: string, soThat: string, acceptanceCriteria: string[], priority: string, estimatedEffort: string}\n- featureSpecs: array of objects {name: string, description: string, userStories: array of objects {id, title, asA, iWant, soThat, acceptanceCriteria, priority, estimatedEffort}, dependencies: string[], technicalNotes: string}\n- nonFunctionalRequirements: array of objects {category: string, requirement: string, rationale: string}\n- backlog: string[]\n- clarificationsNeeded: string[]\n\nEach userStory object MUST be an object with fields id, title, asA, iWant, soThat, acceptanceCriteria, priority, estimatedEffort. Do NOT use strings in place of userStory objects.\n\nExample featureSpec with userStories:\n{"name":"User Auth","description":"Login system","userStories":[{"id":"US-001","title":"User Login","asA":"user","iWant":"to log in","soThat":"I can access the system","acceptanceCriteria":["Email/password login works"],"priority":"HIGH","estimatedEffort":"MEDIUM"}],"dependencies":[],"technicalNotes":""}\n\nRespond ONLY with valid JSON.`,
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
