import { prisma } from '@/lib/prisma';
import { architectureDesignerTool, databaseDesignerTool, apiDesignerTool } from './architect.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { architectAnalysisSchema, type ArchitectAnalysis } from './architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';



async function getOrCreateArchitectAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'ARCHITECT' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Architect AI', role: 'ARCHITECT', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function designArchitecture(
  projectId: string,
  requirements: ProductRequirement,
): Promise<ApiResult<ArchitectAnalysis>> {
  const agentId = await getOrCreateArchitectAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
  await prisma.document.create({
    data: { projectId, type: 'ARCHITECT_IN_PROGRESS', title: 'Architecture In Progress', content: '{}', author: 'Architect AI' },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('ARCHITECT_ANALYSIS_STARTED', { projectId }, agentId);

  try {
    const architectureResult = await architectureDesignerTool.execute({ requirements, projectId, agentId });
    if (!architectureResult.success) throw new Error(architectureResult.error);

    const databaseResult = await databaseDesignerTool.execute({ requirements, projectId, agentId });
    if (!databaseResult.success) throw new Error(databaseResult.error);

    const apiResult = await apiDesignerTool.execute({ requirements, database: databaseResult.data, projectId, agentId });
    if (!apiResult.success) throw new Error(apiResult.error);

    const analysis = architectAnalysisSchema.parse({
      architecture: architectureResult.data,
      database: databaseResult.data,
      api: apiResult.data,
      decisions: [],
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({ data: { projectId, type: 'SYSTEM_ARCHITECTURE', title: 'System Architecture', content: JSON.stringify(analysis.architecture) } }),
      prisma.document.create({ data: { projectId, type: 'DATABASE_DESIGN', title: 'Database Design', content: JSON.stringify(analysis.database) } }),
      prisma.document.create({ data: { projectId, type: 'API_SPECIFICATION', title: 'API Specification', content: JSON.stringify(analysis.api) } }),
      memory.remember({ agentId, content: `Project ${projectId} architecture: ${analysis.architecture.frontend} / ${analysis.architecture.backend} / ${analysis.architecture.database}`, type: 'PROJECT', metadata: { projectId } }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('ARCHITECT_ANALYSIS_COMPLETED', { projectId }, agentId);

    return { success: true, data: analysis };
  } catch (err) {
    await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('ARCHITECT_ANALYSIS_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'Architecture design failed', code: 'AI_ERROR' } };
  }
}

export async function getArchitectureDocuments(projectId: string) {
  return prisma.document.findMany({
    where: { projectId, type: { in: ['SYSTEM_ARCHITECTURE', 'DATABASE_DESIGN', 'API_SPECIFICATION'] } },
    orderBy: { createdAt: 'desc' },
  });
}
