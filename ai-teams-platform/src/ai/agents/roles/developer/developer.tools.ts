import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { generate } from '@/ai/services/ai.service';
import { developerConfig } from './developer.config';
import { DEVELOPER_SYSTEM_PROMPT } from './developer.prompt';
import {
  developmentPlanSchema,
  codeChangeSchema,
  type DeveloperPlan,
  type CodeChange,
} from './developer.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';

function extractJson(text: string): unknown {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) return JSON.parse(jsonMatch[1]);
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try { return JSON.parse(text.slice(firstBracket, lastBracket + 1)); } catch { /* continue */ }
  }
  return JSON.parse(text);
}

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

async function aiCall<T>(prompt: string, projectId?: string, agentId?: string, signal?: AbortSignal): Promise<T> {
  const result = await generate(
    {
      model: developerConfig.preferredModel,
      systemPrompt: DEVELOPER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      temperature: developerConfig.temperature,
      maxTokens: developerConfig.maxTokens,
      provider: developerConfig.preferredProvider,
    },
    { projectId, agentId },
  );
  if (signal?.aborted) throw new Error('BUILD_CANCELLED');
  if (!result.success) throw new Error(result.error.message);
  return extractJson(result.data.content) as T;
}

export const codeGeneratorTool: ITool<
  { architecture: ArchitectAnalysis; task: string; projectId?: string; agentId?: string; signal?: AbortSignal },
  CodeChange[]
> = {
  name: 'code_generator',
  description: 'Generates implementation code for a task given the technical architecture.',
  async execute({ architecture, task, projectId, agentId, signal }): Promise<ToolResult<CodeChange[]>> {
    try {
      const raw = await aiCall<{ changes: unknown[] }>(
        `Architecture: ${JSON.stringify(architecture)}\nTask: ${task}\n\nProduce code changes as JSON: { changes: [{ file, changeType, description, code }] }. changeType must be CREATE, MODIFY, or DELETE. Respond ONLY with valid JSON.`,
        projectId,
        agentId,
        signal,
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

export const developmentPlannerTool: ITool<{ architecture: ArchitectAnalysis; projectId?: string; agentId?: string; signal?: AbortSignal }, DeveloperPlan> = {
  name: 'development_planner',
  description: 'Breaks architecture into an ordered implementation plan.',
  async execute({ architecture, projectId, agentId, signal }): Promise<ToolResult<DeveloperPlan>> {
    try {
      const raw = await aiCall<unknown>(
        `Architecture: ${JSON.stringify(architecture)}\n\nProduce a development plan as JSON with keys: tasks (array of strings), files (array of strings), dependencies (array of strings), implementationOrder (array of strings). Respond ONLY with valid JSON.`,
        projectId,
        agentId,
        signal,
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
