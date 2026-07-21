import { prisma } from '@/lib/prisma';
import { developmentPlannerTool, codeGeneratorTool } from './developer.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { developerOutputSchema, type DeveloperOutput } from './developer.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ApiResult } from '@/types/common.types';

const TOOL_DELAY_MS = 1500;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getOrCreateDeveloperAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DEVELOPER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Developer AI', role: 'DEVELOPER', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function implementArchitecture(
  projectId: string,
  architecture: ArchitectAnalysis,
): Promise<ApiResult<DeveloperOutput>> {
  const agentId = await getOrCreateDeveloperAgentId();
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: 'WORKING' },
  });
  await logAIEvent('DEVELOPER_IMPLEMENTATION_STARTED', { projectId }, agentId);

  try {
    const planResult = await developmentPlannerTool.execute({ architecture, projectId, agentId });
    if (!planResult.success) throw new Error(planResult.error);

    const allChanges = [];
    for (const task of planResult.data.tasks) {
      const changesResult = await codeGeneratorTool.execute({ architecture, task, projectId, agentId });
      if (changesResult.success && changesResult.data) {
        allChanges.push(...changesResult.data);
      }
      if (planResult.data.tasks.indexOf(task) < planResult.data.tasks.length - 1) {
        await delay(TOOL_DELAY_MS);
      }
    }

    const output = developerOutputSchema.parse({
      plan: planResult.data,
      changes: allChanges,
      report: {
        completed: allChanges.length > 0,
        changedFiles: [...new Set(allChanges.map((c) => c.file))],
        issues:
          allChanges.length < planResult.data.tasks.length
            ? ['Some tasks failed to generate code']
            : [],
        notes: `Implemented ${allChanges.length} file change(s) across ${planResult.data.tasks.length} task(s).`,
      },
    });

    const memory = getMemoryManager();
    await memory.remember({
      agentId,
      content: `Project ${projectId}: implemented ${output.report.changedFiles.length} files`,
      type: 'PROJECT',
      metadata: { projectId },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'IDLE' },
    });
    await logAIEvent('DEVELOPER_IMPLEMENTATION_COMPLETED', { projectId }, agentId);

    return { success: true, data: output };
  } catch (err) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ERROR' },
    });
    await logAIEvent('DEVELOPER_IMPLEMENTATION_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Implementation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
