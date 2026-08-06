/**
 * Safe ProjectWorkflowState access for Prisma + @prisma/adapter-pg.
 *
 * Never select list columns through the Prisma client (adapter can throw
 * `e.map is not a function`). Lists may be Postgres text[] OR jsonb in
 * real DBs — write/read both safely.
 */
import { prisma } from '@/lib/prisma';

export const WORKFLOW_SCALAR_SELECT = {
  projectId: true,
  currentPhase: true,
  activeAgent: true,
  currentArtifact: true,
  progress: true,
  nextAction: true,
  metadata: true,
} as const;

export type WorkflowScalars = {
  projectId: string;
  currentPhase: string;
  activeAgent: string | null;
  currentArtifact: string | null;
  progress: number;
  nextAction: string | null;
  metadata: unknown;
};

export async function findWorkflowScalars(
  projectId: string,
): Promise<WorkflowScalars | null> {
  try {
    return await prisma.projectWorkflowState.findUnique({
      where: { projectId },
      select: WORKFLOW_SCALAR_SELECT,
    });
  } catch (err: any) {
    console.warn('[workflow-state] findUnique failed:', err?.message);
    try {
      const rows = await prisma.$queryRaw<WorkflowScalars[]>`
        SELECT
          "projectId",
          "currentPhase",
          "activeAgent",
          "currentArtifact",
          progress,
          "nextAction",
          metadata
        FROM project_workflow_states
        WHERE "projectId" = ${projectId}
        LIMIT 1
      `;
      return rows[0] ?? null;
    } catch (rawErr: any) {
      console.warn('[workflow-state] raw load failed:', rawErr?.message);
      return null;
    }
  }
}

/** Update scalars only; never return list columns in the response. */
export async function updateWorkflowScalars(
  projectId: string,
  data: {
    currentPhase?: string;
    activeAgent?: string | null;
    currentArtifact?: string | null;
    progress?: number;
    nextAction?: string | null;
    metadata?: unknown;
  },
): Promise<void> {
  await prisma.projectWorkflowState.update({
    where: { projectId },
    data: data as any,
    select: { projectId: true },
  });
}

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        /* ignore */
      }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
        .filter(Boolean);
    }
  }
  return [];
}

/**
 * Write list columns. Production DBs may store these as jsonb (not text[]).
 * Try jsonb first, then text[].
 */
export async function setWorkflowTextArray(
  projectId: string,
  column: 'completedPhases' | 'waitingApprovals' | 'risks',
  values: string[],
): Promise<void> {
  const col =
    column === 'risks' ? 'risks' : column === 'completedPhases' ? '"completedPhases"' : '"waitingApprovals"';
  const json = JSON.stringify(values);

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE project_workflow_states SET ${col} = $1::jsonb WHERE "projectId" = $2`,
      json,
      projectId,
    );
    return;
  } catch (jsonErr: any) {
    // Fall through to text[]
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE project_workflow_states SET ${col} = ARRAY(SELECT jsonb_array_elements_text($1::jsonb))::text[] WHERE "projectId" = $2`,
      json,
      projectId,
    );
  } catch (err: any) {
    console.warn(`[workflow-state] set ${column} failed:`, err?.message);
  }
}

/** Load list columns without going through the Prisma String[] mapper. */
export async function loadWorkflowLists(projectId: string): Promise<{
  completedPhases: string[];
  waitingApprovals: string[];
  risks: string[];
}> {
  try {
    const rows = await prisma.$queryRaw<
      { completedPhases: unknown; waitingApprovals: unknown; risks: unknown }[]
    >`
      SELECT "completedPhases", "waitingApprovals", risks
      FROM project_workflow_states
      WHERE "projectId" = ${projectId}
      LIMIT 1
    `;
    const row = rows[0];
    return {
      completedPhases: parseStringList(row?.completedPhases),
      waitingApprovals: parseStringList(row?.waitingApprovals),
      risks: parseStringList(row?.risks),
    };
  } catch {
    return { completedPhases: [], waitingApprovals: [], risks: [] };
  }
}
