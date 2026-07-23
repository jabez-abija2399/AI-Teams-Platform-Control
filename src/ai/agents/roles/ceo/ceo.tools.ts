import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { aiCall } from '@/ai/agents/core/ai-call';
import { ceoConfig } from './ceo.config';
import { CEO_SYSTEM_PROMPT } from './ceo.prompt';
import {
  productVisionSchema,
  productRequirementSchema,
  developmentPlanSchema,
  type ProductVision,
  type ProductRequirement,
  type DevelopmentPlan,
} from './ceo.types';

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeEnums(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalizeEnums);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if ((k === 'priority' || k === 'estimatedComplexity') && typeof v === 'string') {
        out[k] = v.toUpperCase();
      } else {
        out[k] = normalizeEnums(v);
      }
    }
    return out;
  }
  return obj;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const requirementBuilderTool: ITool<{ userIdea: string; projectId?: string; agentId?: string }, ProductVision> = {
  name: 'requirement_builder',
  description:
    'Turns a raw user idea into a structured product vision (problem, solution, target users, goal).',
  async execute({ userIdea, projectId, agentId }): Promise<ToolResult<ProductVision>> {
    try {
      const raw = await aiCall<unknown>(
        `User idea: "${userIdea}"\n\nProduce a product vision as JSON with keys: problem (string), solution (string), targetUsers (array of strings), businessGoal (string). Each field MUST be a non-empty value. Do NOT include any extra keys. Respond ONLY with valid JSON.`,
        CEO_SYSTEM_PROMPT,
        'CEO',
        ceoConfig,
        projectId,
        agentId,
      );
      const data = productVisionSchema.parse(raw);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Requirement builder failed',
      };
    }
  },
};

export const featurePlannerTool: ITool<{ vision: ProductVision; projectId?: string; agentId?: string }, ProductRequirement> = {
  name: 'feature_planner',
  description: 'Turns a product vision into a feature list, user stories, and priorities.',
  async execute({ vision, projectId, agentId }): Promise<ToolResult<ProductRequirement>> {
    try {
      const raw = await aiCall<unknown>(
        `Product vision: ${JSON.stringify(vision)}\n\nProduce product requirements as JSON with keys: features (array of {name, description}), userStories (array of {as, iWant, soThat, priority}), priorities (array of strings), constraints (array of strings). Respond ONLY with valid JSON.`,
        CEO_SYSTEM_PROMPT,
        'CEO',
        ceoConfig,
        projectId,
        agentId,
      );
      const data = productRequirementSchema.parse(normalizeEnums(raw));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Feature planner failed',
      };
    }
  },
};

export const roadmapGeneratorTool: ITool<{ requirements: ProductRequirement; projectId?: string; agentId?: string }, DevelopmentPlan> = {
  name: 'roadmap_generator',
  description: 'Turns product requirements into a phased development plan.',
  async execute({ requirements, projectId, agentId }): Promise<ToolResult<DevelopmentPlan>> {
    try {
      const raw = await aiCall<unknown>(
        `Requirements: ${JSON.stringify(requirements)}\n\nProduce a phased development plan as JSON.\nYou MUST include ALL of these top-level keys:\n- "phases": array of objects with "name" (string), "goal" (string), "tasks" (array of strings)\n- "tasks": flat array of strings (all tasks across all phases)\n- "estimatedComplexity": one of "LOW", "MEDIUM", "HIGH", "VERY_HIGH"\n- "qualityScore": object with "completeness" (1-10), "clarity" (1-10), "feasibility" (1-10), "overall" (1-10), "verdict" ("APPROVED"/"NEEDS_REVISION"/"REJECTED")\n\nExample format:\n{"phases":[{"name":"Phase 1","goal":"...","tasks":["..."]}],"tasks":["..."],"estimatedComplexity":"MEDIUM","qualityScore":{"completeness":8,"clarity":7,"feasibility":8,"overall":8,"verdict":"APPROVED"}}\n\nRespond ONLY with valid JSON, no markdown.`,
        CEO_SYSTEM_PROMPT,
        'CEO',
        ceoConfig,
        projectId,
        agentId,
      );
      const data = developmentPlanSchema.parse(normalizeEnums(raw));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Roadmap generator failed',
      };
    }
  },
};

export const taskCreatorTool: ITool<{ plan: DevelopmentPlan }, string[]> = {
  name: 'task_creator',
  description: 'Flattens a development plan into a concrete task list for the AI team.',
  async execute({ plan }): Promise<ToolResult<string[]>> {
    const tasks = plan.phases.flatMap((phase) => phase.tasks);
    return { success: true, data: tasks };
  },
};
