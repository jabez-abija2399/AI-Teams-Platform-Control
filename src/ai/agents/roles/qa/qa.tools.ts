import type { ITool, ToolResult } from '@/ai/agents/tools/tool.interface';
import { aiCall } from '@/ai/agents/core/ai-call';
import { qaConfig } from './qa.config';
import { QA_SYSTEM_PROMPT } from './qa.prompt';
import { testPlanSchema, bugReportSchema, type TestPlan, type BugReport } from './qa.types';
import type { DeveloperOutput } from '@/ai/agents/roles/developer/developer.types';

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

export const testGeneratorTool: ITool<{ implementation: DeveloperOutput; projectId?: string; agentId?: string }, TestPlan> = {
  name: 'test_generator',
  description: 'Generates unit and integration test cases for an implementation.',
  async execute({ implementation, projectId, agentId }): Promise<ToolResult<TestPlan>> {
    try {
      const raw = await aiCall<unknown>(
        `Implementation: ${JSON.stringify(implementation)}\n\nProduce a test plan as JSON with keys: tests (array of {name, type, steps}), coverage (string), strategy (string). type must be UNIT, INTEGRATION, or E2E. Respond ONLY with valid JSON.`,
        QA_SYSTEM_PROMPT,
        'QA',
        qaConfig,
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
        QA_SYSTEM_PROMPT,
        'QA',
        qaConfig,
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
