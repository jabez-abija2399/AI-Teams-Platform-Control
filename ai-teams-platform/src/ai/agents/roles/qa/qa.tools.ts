import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { generate } from '@/ai/services/ai.service';
import { qaConfig } from './qa.config';
import { QA_SYSTEM_PROMPT } from './qa.prompt';
import { testPlanSchema, bugReportSchema, type TestPlan, type BugReport } from './qa.types';
import type { DeveloperOutput } from '@/ai/agents/roles/developer/developer.types';

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
      if (k === 'severity' || k === 'type') {
        out[k] = typeof v === 'string' ? v.toUpperCase() : normalizeEnums(v);
      } else {
        out[k] = normalizeEnums(v);
      }
    }
    return out;
  }
  return obj;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function aiCall<T>(prompt: string, projectId?: string, agentId?: string): Promise<T> {
  const result = await generate(
    {
      model: qaConfig.preferredModel,
      systemPrompt: QA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      temperature: qaConfig.temperature,
      maxTokens: qaConfig.maxTokens,
      provider: qaConfig.preferredProvider,
    },
    { projectId, agentId },
  );
  if (!result.success) throw new Error(result.error.message);
  return extractJson(result.data.content) as T;
}

export const testGeneratorTool: ITool<{ implementation: DeveloperOutput; projectId?: string; agentId?: string }, TestPlan> = {
  name: 'test_generator',
  description: 'Generates unit and integration test cases for an implementation.',
  async execute({ implementation, projectId, agentId }): Promise<ToolResult<TestPlan>> {
    try {
      const raw = await aiCall<unknown>(
        `Implementation: ${JSON.stringify(implementation)}\n\nProduce a test plan as JSON with keys: tests (array of {name, type, steps}), coverage (string), strategy (string). type must be UNIT, INTEGRATION, or E2E. Respond ONLY with valid JSON.`,
        projectId,
        agentId,
      );
      const data = testPlanSchema.parse(normalizeEnums(raw));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Test generation failed',
      };
    }
  },
};

export const bugAnalyzerTool: ITool<{ implementation: DeveloperOutput; projectId?: string; agentId?: string }, BugReport[]> = {
  name: 'bug_analyzer',
  description:
    'Finds logic errors, security issues, and performance problems in an implementation.',
  async execute({ implementation, projectId, agentId }): Promise<ToolResult<BugReport[]>> {
    try {
      const raw = await aiCall<{ bugs: unknown[] }>(
        `Implementation: ${JSON.stringify(implementation)}\n\nFind bugs. Return JSON: { bugs: [{ severity, description, location, solution }] }. severity must be LOW, MEDIUM, HIGH, or CRITICAL. Respond ONLY with valid JSON.`,
        projectId,
        agentId,
      );
      const data = raw.bugs.map((b) => bugReportSchema.parse(normalizeEnums(b)));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Bug analysis failed',
      };
    }
  },
};
