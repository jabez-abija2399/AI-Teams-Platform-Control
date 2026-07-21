import { prisma } from '@/lib/prisma';
import { testGeneratorTool, bugAnalyzerTool } from './qa.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { qaOutputSchema, type QAOutput } from './qa.types';
import type { DeveloperOutput } from '@/ai/agents/roles/developer/developer.types';
import type { ApiResult } from '@/types/common.types';

const TOOL_DELAY_MS = 1500;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getOrCreateQAAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'QA' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'QA AI', role: 'QA', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function reviewImplementation(
  projectId: string,
  implementation: DeveloperOutput,
): Promise<ApiResult<QAOutput>> {
  const agentId = await getOrCreateQAAgentId();
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: 'WORKING' },
  });
  await logAIEvent('QA_REVIEW_STARTED', { projectId }, agentId);

  try {
    const testPlanResult = await testGeneratorTool.execute({ implementation, projectId, agentId });
    if (!testPlanResult.success) throw new Error(testPlanResult.error);

    await delay(TOOL_DELAY_MS);

    const bugsResult = await bugAnalyzerTool.execute({ implementation, projectId, agentId });
    if (!bugsResult.success) throw new Error(bugsResult.error);

    const criticalCount = bugsResult.data.filter((b) => b.severity === 'CRITICAL').length;
    const highCount = bugsResult.data.filter((b) => b.severity === 'HIGH').length;
    const score = Math.max(
      0,
      100 - criticalCount * 30 - highCount * 15 - bugsResult.data.length * 5,
    );

    const output = qaOutputSchema.parse({
      testPlan: testPlanResult.data,
      qualityReport: {
        score,
        issues: bugsResult.data,
        recommendations: bugsResult.data.map((b) => b.solution),
      },
    });

    const memory = getMemoryManager();
    await memory.remember({
      agentId,
      content: `Project ${projectId} QA review: score ${output.qualityReport.score}, ${bugsResult.data.length} issue(s) found`,
      type: 'PROJECT',
      metadata: { projectId },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'IDLE' },
    });
    await logAIEvent('QA_REVIEW_COMPLETED', { projectId, score }, agentId);

    return { success: true, data: output };
  } catch (err) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ERROR' },
    });
    await logAIEvent('QA_REVIEW_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'QA review failed',
        code: 'AI_ERROR',
      },
    };
  }
}
