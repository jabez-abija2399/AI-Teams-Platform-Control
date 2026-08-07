/**
 * Load / save user-confirmed project stack.
 * Confirmation is durable via a dedicated memory key — Preview must not re-ask.
 */

import { CompanyMemoryService } from '@/core/memory/company-memory.service';
import { prisma } from '@/lib/prisma';
import {
  STACK_OPTIONS,
  constraintsForStack,
  detectStackFromFiles,
  getStackCatalogEntry,
  isValidProjectStack,
  labelForStack,
  type DetectedStack,
  type ProjectStackId,
  type StackCatalogEntry,
} from './stack-catalog';

/** Durable stack record — survives company_memory merges / agent suggestions. */
export const CONFIRMED_STACK_KEY = 'confirmed_stack';

export interface ProjectStackState {
  /** User-confirmed stack — Preview must honor this when set. */
  confirmed: ProjectStackId | null;
  confirmedAt: string | null;
  detected: DetectedStack;
  /** Effective stack used for Preview (confirmed ?? detected if high confidence). */
  effective: ProjectStackId;
  needsConfirmation: boolean;
  catalog: StackCatalogEntry[];
  entry: StackCatalogEntry | null;
}

async function loadFileSignals(projectId: string): Promise<{
  paths: string[];
  packageJson: string | null;
}> {
  const repo = await prisma.repository.findUnique({
    where: { projectId },
    include: {
      files: {
        select: { path: true, content: true },
        take: 200,
      },
    },
  });
  if (!repo) return { paths: [], packageJson: null };
  const paths = repo.files.map((f) => f.path);
  const pkg = repo.files.find((f) => f.path === 'package.json');
  return { paths, packageJson: pkg?.content ?? null };
}

async function readDurableConfirmedStack(
  projectId: string,
): Promise<{ stack: Exclude<ProjectStackId, 'unknown'>; confirmedAt: string | null } | null> {
  try {
    const record = await prisma.companyMemoryRecord.findFirst({
      where: { projectId, key: CONFIRMED_STACK_KEY },
      orderBy: { version: 'desc' },
    });
    if (!record?.value || typeof record.value !== 'object') return null;
    const value = record.value as { stack?: unknown; confirmedAt?: unknown };
    if (!isValidProjectStack(value.stack)) return null;
    return {
      stack: value.stack,
      confirmedAt: typeof value.confirmedAt === 'string' ? value.confirmedAt : null,
    };
  } catch {
    return null;
  }
}

async function writeDurableConfirmedStack(
  projectId: string,
  stack: Exclude<ProjectStackId, 'unknown'>,
  confirmedAt: string,
): Promise<void> {
  const version = Date.now();
  try {
    await prisma.companyMemoryRecord.create({
      data: {
        projectId,
        key: CONFIRMED_STACK_KEY,
        value: { stack, confirmedAt },
        version,
      },
    });
  } catch (err) {
    console.error('[ProjectStack] Failed to persist durable stack:', err);
    throw err;
  }
}

export async function getProjectStackState(projectId: string): Promise<ProjectStackState> {
  const { paths, packageJson } = await loadFileSignals(projectId);
  const detected = detectStackFromFiles(paths, packageJson);

  let confirmed: ProjectStackId | null = null;
  let confirmedAt: string | null = null;

  const durable = await readDurableConfirmedStack(projectId);
  if (durable) {
    confirmed = durable.stack;
    confirmedAt = durable.confirmedAt;
  } else {
    try {
      const { data } = await CompanyMemoryService.getMemory(projectId);
      const prefs = data.userPreferences || {};
      if (prefs.stackConfirmed === true && isValidProjectStack(prefs.stack)) {
        confirmed = prefs.stack;
        confirmedAt = typeof prefs.stackConfirmedAt === 'string' ? prefs.stackConfirmedAt : null;
      }
    } catch {
      /* ignore */
    }
  }

  const needsConfirmation = !confirmed;
  const effective: ProjectStackId =
    confirmed ??
    (detected.confidence === 'high' && detected.stack !== 'unknown'
      ? detected.stack
      : 'unknown');

  const entryId: ProjectStackId =
    confirmed ?? (detected.stack !== 'unknown' ? detected.stack : 'static-html');

  return {
    confirmed,
    confirmedAt,
    detected,
    effective,
    needsConfirmation,
    catalog: STACK_OPTIONS,
    entry: getStackCatalogEntry(entryId),
  };
}

export async function confirmProjectStack(
  projectId: string,
  stack: ProjectStackId,
): Promise<ProjectStackState & { previousStack: ProjectStackId | null }> {
  if (!isValidProjectStack(stack)) {
    throw new Error('Invalid stack');
  }

  const before = await getProjectStackState(projectId);
  const previousStack = before.confirmed;

  const entry = getStackCatalogEntry(stack)!;
  const now = new Date().toISOString();

  // Durable first — Preview reads this and must not re-ask
  await writeDurableConfirmedStack(projectId, stack, now);

  await CompanyMemoryService.updateMemory(projectId, {
    constraints: constraintsForStack(stack),
    userPreferences: {
      stack,
      stackConfirmed: true,
      stackConfirmedAt: now,
      previousStack: previousStack || undefined,
      styling: stack === 'static-html' ? 'HTML/CSS' : stack === 'react' ? 'React' : 'Next.js',
      label: entry.label,
      previewStrategy: entry.previewStrategy,
      usesWebContainer: entry.usesWebContainer,
    },
    notes: [`User confirmed stack: ${entry.label}`],
  });

  const state = await getProjectStackState(projectId);
  return { ...state, previousStack };
}

/** Trigger architecture regeneration after a stack change. */
export async function requestArchitectureRegenForStack(
  projectId: string,
  stack: ProjectStackId,
  reviewedBy: string = 'Stack Change',
): Promise<{ success: boolean; message: string }> {
  const entry = getStackCatalogEntry(stack);
  const comments = [
    `User changed delivery stack to ${entry?.label || stack}.`,
    `Regenerate architecture to match this stack.`,
    ...constraintsForStack(stack),
  ].join('\n');

  try {
    const { ProjectLifecycleService } = await import(
      '@/core/company-orchestration/project-lifecycle.service'
    );
    const result = await ProjectLifecycleService.requestChangesAndRegenerate(
      projectId,
      'Architecture Approval',
      reviewedBy,
      comments,
    );
    if (!result.success) {
      return {
        success: false,
        message: result.error?.message || 'Could not regenerate architecture',
      };
    }
    return { success: true, message: 'Architecture regeneration started' };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Regenerate failed',
    };
  }
}

export async function clearProjectStackConfirmation(projectId: string): Promise<ProjectStackState> {
  const { data } = await CompanyMemoryService.getMemory(projectId);
  await CompanyMemoryService.updateMemory(projectId, {
    userPreferences: {
      ...data.userPreferences,
      stackConfirmed: false,
      stackConfirmedAt: null,
    },
    notes: ['User cleared stack confirmation — choose again'],
  });

  try {
    await prisma.companyMemoryRecord.create({
      data: {
        projectId,
        key: CONFIRMED_STACK_KEY,
        value: { stack: null, clearedAt: new Date().toISOString() },
        version: Date.now(),
      },
    });
  } catch {
    /* ignore */
  }

  return getProjectStackState(projectId);
}

export { labelForStack, STACK_OPTIONS };
