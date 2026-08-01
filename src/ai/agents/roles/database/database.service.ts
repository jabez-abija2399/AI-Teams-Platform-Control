import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { databaseConfig } from './database.config';
import { DATABASE_SYSTEM_PROMPT } from './database.prompt';
import {
  databaseDesignSpecSchema,
  type DatabaseDesignSpec,
} from './database.types';
import type { ApiResult } from '@/types/common.types';

const DB_ROLE_NAME = 'Database Specialist AI';

async function getOrCreateDBAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DATABASE' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: DB_ROLE_NAME,
      role: 'DATABASE',
      status: 'IDLE',
      capabilities: ['DATABASE_DESIGN', 'ARCHITECTURE', 'SYSTEM_DESIGN'],
    },
  });
  return created.id;
}

export async function generateDatabaseDesignSpec(
  projectId: string,
  architectureData: unknown,
): Promise<ApiResult<DatabaseDesignSpec>> {
  const agentId = await getOrCreateDBAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DATABASE_DESIGN_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Architecture & Requirements:\n${JSON.stringify(architectureData, null, 2)}\n\nGenerate comprehensive Database Design Specification (ERD, Prisma Schema, Indexes, Relations, Migration Plan, Seed Plan, Optimization, Caching, Backup/Recovery). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      DATABASE_SYSTEM_PROMPT,
      'DATABASE',
      databaseConfig,
      projectId,
      agentId,
    );

    const spec = databaseDesignSpecSchema.parse(raw);

    const savedDoc = await prisma.databaseDesignDocument.create({
      data: {
        projectId,
        erd: spec.erd as any,
        prismaSchema: spec.prismaSchema,
        indexes: spec.indexes as any,
        relations: spec.relations as any,
        foreignKeys: spec.foreignKeys as any,
        migrationPlan: spec.migrationPlan as any,
        seedPlan: spec.seedPlan as any,
        optimization: spec.optimization as any,
        queryPlan: spec.queryPlan as any,
        partitionStrategy: spec.partitionStrategy as any,
        cachingStrategy: spec.cachingStrategy as any,
        databaseConstraints: spec.databaseConstraints as any,
        namingConventions: spec.namingConventions as any,
        backupStrategy: spec.backupStrategy as any,
        recoveryStrategy: spec.recoveryStrategy as any,
        databaseDocumentation: spec.databaseDocumentation as any,
        status: spec.status,
      },
    });

    const existingArch = await prisma.architectureDocument.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingArch) {
      await prisma.architectureDocument.update({
        where: { id: existingArch.id },
        data: { databaseDesign: spec as any },
      });
    } else {
      await prisma.architectureDocument.create({
        data: {
          projectId,
          agentId,
          architecture: {} as any,
          databaseDesign: spec as any,
          apiSpec: {} as any,
          decisions: [] as any,
        },
      });
    }

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'DATABASE_DESIGN',
          title: `Database Architecture & Schema Specification`,
          content: JSON.stringify(spec),
          author: DB_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Database Design Spec with ${spec.indexes.length} indexes and migration plan.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DATABASE_DESIGN_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('DATABASE_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Database design generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
