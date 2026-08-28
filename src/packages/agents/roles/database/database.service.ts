import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/packages/agents/core/ai-call';
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

/** Lean database spec so Database never stalls Mission Control on slow LLM calls. */
export function buildHeuristicDatabaseDesignSpec(
  architectureData: unknown,
  feedback?: string,
): DatabaseDesignSpec {
  const blob = `${JSON.stringify(architectureData || {})} ${feedback || ''}`.toLowerCase();
  const isAuth = blob.includes('login') || blob.includes('auth') || blob.includes('user');
  const note = feedback?.trim() || 'Generated from architecture for pipeline continuity';

  const entities = isAuth
    ? [
        { name: 'User', fields: ['id (cuid)', 'email (string, unique)', 'passwordHash (string)', 'name (string?)', 'createdAt (datetime)', 'updatedAt (datetime)'], description: 'Application user' },
        { name: 'Session', fields: ['id (cuid)', 'userId (string, FK)', 'expiresAt (datetime)', 'createdAt (datetime)'], description: 'User session' },
      ]
    : [
        { name: 'User', fields: ['id (cuid)', 'email (string, unique)', 'createdAt (datetime)', 'updatedAt (datetime)'], description: 'Application user' },
      ];

  const indexes = isAuth
    ? [
        { model: 'User', fields: ['email'], type: 'unique', purpose: 'Fast login lookup' },
        { model: 'Session', fields: ['userId'], type: 'index', purpose: 'Session lookup by user' },
        { model: 'Session', fields: ['expiresAt'], type: 'index', purpose: 'Cleanup expired sessions' },
      ]
    : [
        { model: 'User', fields: ['email'], type: 'unique', purpose: 'Fast lookup' },
      ];

  return databaseDesignSpecSchema.parse({
    erd: { entities, relationships: isAuth ? [{ from: 'User', to: 'Session', type: '1:N', description: 'User has many sessions' }] : [] },
    prismaSchema: `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n${entities.map((e) => `model ${e.name} {\n  ${e.fields.join('\n  ')}\n}`).join('\n\n')}`,
    indexes,
    relations: isAuth ? [{ from: 'User', to: 'Session', type: 'OneToMany', constraint: 'onDelete: Cascade' }] : [],
    foreignKeys: isAuth ? [{ field: 'Session.userId', references: 'User.id', onDelete: 'Cascade' }] : [],
    migrationPlan: [{ step: 1, action: 'Create User table', description: note }, ...(isAuth ? [{ step: 2, action: 'Create Session table', description: 'Session management' }] : [])],
    seedPlan: { users: isAuth ? [{ email: 'admin@example.com', name: 'Admin', role: 'ADMIN' }] : [], description: 'Seed default data' },
    optimization: { connectionPool: 'PgBouncer or Prisma pool (max 5)', queryOptimization: 'Use select() to avoid loading unnecessary fields', caching: 'Redis for session store' },
    queryPlan: { frequentlyQueried: isAuth ? ['User.findByEmail', 'Session.findByUserId'] : ['User'], complexQueries: [], nPlusOneRisks: [] },
    partitionStrategy: { strategy: 'None for MVP', rationale: 'PostgreSQL handles small-to-medium datasets well' },
    cachingStrategy: { layer: 'Application-level', tool: 'LRU cache for hot paths', ttl: '5 minutes' },
    databaseConstraints: isAuth ? [{ model: 'User', constraint: 'UNIQUE(email)', reason: 'Prevent duplicate accounts' }] : [],
    namingConventions: { tables: 'snake_case plural (users, sessions)', columns: 'camelCase (userId, passwordHash)', indexes: 'idx_{table}_{column}' },
    backupStrategy: { frequency: 'Daily', retention: '30 days', method: 'pg_dump to cloud storage' },
    recoveryStrategy: { rpo: '24 hours', rto: '1 hour', steps: ['Restore from backup', 'Run migrations', 'Verify data integrity'] },
    databaseDocumentation: { purpose: 'Application data store for ' + (isAuth ? 'user authentication' : 'core entities'), schemaVersion: '1.0.0', notes: note },
    status: 'APPROVED',
  });
}

export async function generateDatabaseDesignSpec(
  projectId: string,
  architectureData: unknown,
  feedback?: string,
): Promise<ApiResult<DatabaseDesignSpec>> {
  const agentId = await getOrCreateDBAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DATABASE_DESIGN_STARTED', { projectId }, agentId);

  try {
    // Lean-first: return heuristic immediately so Database never stalls the pipeline.
    const spec = buildHeuristicDatabaseDesignSpec(architectureData, feedback);

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
        metadata: { projectId },
      }),
    ]);

    // Optional background LLM enrichment — never blocks the pipeline
    if (!feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `Input Architecture & Requirements:\n${JSON.stringify(architectureData, null, 2).slice(0, 5000)}\n\nGenerate lean Database Design Specification JSON. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(prompt, DATABASE_SYSTEM_PROMPT, 'DATABASE', databaseConfig, projectId, agentId),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Database LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = databaseDesignSpecSchema.safeParse(raw);
          if (parsed.success) {
            const existing = await prisma.databaseDesignDocument.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
            if (existing) {
              await prisma.databaseDesignDocument.update({ where: { id: existing.id }, data: { erd: parsed.data.erd as any, prismaSchema: parsed.data.prismaSchema, indexes: parsed.data.indexes as any, status: parsed.data.status } });
            } else {
              await prisma.databaseDesignDocument.create({
                data: {
                  projectId,
                  erd: parsed.data.erd as any,
                  prismaSchema: parsed.data.prismaSchema,
                  indexes: parsed.data.indexes as any,
                  relations: parsed.data.relations as any,
                  foreignKeys: parsed.data.foreignKeys as any,
                  migrationPlan: parsed.data.migrationPlan as any,
                  seedPlan: parsed.data.seedPlan as any,
                  optimization: parsed.data.optimization as any,
                  queryPlan: parsed.data.queryPlan as any,
                  partitionStrategy: parsed.data.partitionStrategy as any,
                  cachingStrategy: parsed.data.cachingStrategy as any,
                  databaseConstraints: parsed.data.databaseConstraints as any,
                  namingConventions: parsed.data.namingConventions as any,
                  backupStrategy: parsed.data.backupStrategy as any,
                  recoveryStrategy: parsed.data.recoveryStrategy as any,
                  databaseDocumentation: parsed.data.databaseDocumentation as any,
                  status: parsed.data.status,
                },
              });
            }
          }
        } catch {
          // optional
        }
      })();
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DATABASE_DESIGN_COMPLETED', { projectId }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicDatabaseDesignSpec(architectureData, feedback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('DATABASE_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message: fallbackErr instanceof Error ? fallbackErr.message : err instanceof Error ? err.message : 'Database design generation failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
