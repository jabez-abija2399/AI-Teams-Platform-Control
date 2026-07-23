import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { aiCall } from '@/ai/agents/core/ai-call';
import { developerConfig } from './developer.config';
import { DEVELOPER_SYSTEM_PROMPT } from './developer.prompt';
import {
  developmentPlanSchema,
  codeChangeSchema,
  implementationReportSchema,
  type DeveloperPlan,
  type CodeChange,
  type ImplementationReport,
} from './developer.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';
import { readFileTool, writeFileTool, listDirectoryTool } from '@/ai/agents/tools/file-system.tool';
import { runCommandTool } from '@/ai/agents/tools/shell.tool';

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeEnums(obj: any): any {
  if (Array.isArray(obj)) return obj.map(normalizeEnums);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'changeType' && typeof v === 'string') {
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

export const codeGeneratorTool: ITool<
  { architecture: ArchitectAnalysis; task: string; projectId?: string; agentId?: string; signal?: AbortSignal; requirements?: ProductRequirement },
  CodeChange[]
> = {
  name: 'code_generator',
  description: 'Generates implementation code for a task given the technical architecture.',
  async execute({ architecture, task, projectId, agentId, signal, requirements }): Promise<ToolResult<CodeChange[]>> {
    try {
      const context = `Architecture: ${JSON.stringify(architecture)}${requirements ? `\nRequirements: ${JSON.stringify(requirements)}` : ''}\nTask: ${task}\n\nScope rule: Only generate files for layers that are active. If backend is "None" or "Deferred", do NOT create any backend files (no server code, no app.js, no API routes, etc.).\n\nProduce code changes as JSON: { changes: [{ file, changeType, description, code }] }. changeType must be CREATE, MODIFY, or DELETE. Respond ONLY with valid JSON.`;
      const raw = await aiCall<{ changes: unknown[] }>(
        context,
        DEVELOPER_SYSTEM_PROMPT,
        'DEVELOPER',
        developerConfig,
        projectId,
        agentId,
      );
      const data = raw.changes.map((c) => codeChangeSchema.parse(normalizeEnums(c)));
      return { success: true, data };
    } catch (err) {
      if (err instanceof Error && err.message === 'BUILD_CANCELLED') {
        return { success: false, error: 'BUILD_CANCELLED' };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Code generator failed',
      };
    }
  },
};

export const developmentPlannerTool: ITool<{ architecture: ArchitectAnalysis; projectId?: string; agentId?: string; signal?: AbortSignal; requirements?: ProductRequirement }, DeveloperPlan> = {
  name: 'development_planner',
  description: 'Breaks architecture into an ordered implementation plan.',
  async execute({ architecture, projectId, agentId, signal, requirements }): Promise<ToolResult<DeveloperPlan>> {
    try {
      const context = `Architecture: ${JSON.stringify(architecture)}${requirements ? `\nRequirements: ${JSON.stringify(requirements)}` : ''}\n\nScope rule: Only generate files for layers that are actually active. If a layer (backend, database, etc.) says "None" or "Deferred", do NOT include tasks or files for that layer.\n\nProduce a development plan as JSON with keys: tasks (array of strings), files (array of strings), dependencies (array of strings), implementationOrder (array of strings). Respond ONLY with valid JSON.`;
      const raw = await aiCall<unknown>(
        context,
        DEVELOPER_SYSTEM_PROMPT,
        'DEVELOPER',
        developerConfig,
        projectId,
        agentId,
      );
      const data = developmentPlanSchema.parse(normalizeEnums(raw));
      return { success: true, data };
    } catch (err) {
      if (err instanceof Error && err.message === 'BUILD_CANCELLED') {
        return { success: false, error: 'BUILD_CANCELLED' };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Development planning failed',
      };
    }
  },
};

export { readFileTool, writeFileTool, listDirectoryTool, runCommandTool };
