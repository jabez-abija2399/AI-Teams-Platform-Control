/**
 * Project credit + strict-mode settings for Mission Control.
 * Uses org CreditAccount when linked; otherwise workflow metadata for local/demo.
 */

import { prisma } from '@/lib/prisma';
import { findWorkflowScalars, updateWorkflowScalars } from '@/core/company-orchestration/workflow-state-access';
import { CompanyMemoryService } from '@/core/memory/company-memory.service';

export interface ProjectCreditSnapshot {
  /** Platform/org credit balance (null = unknown / provider-only). */
  balance: number | null;
  monthlyLimit: number | null;
  source: 'organization' | 'project' | 'unknown';
  /** When true, never use heuristic fallbacks — fail and wait for Resume. */
  strictMode: boolean;
  lowBalance: boolean;
}

const DEFAULT_PROJECT_BALANCE = 100;

function readMetaCredits(meta: Record<string, unknown>): {
  balance?: number;
  strictMode?: boolean;
} {
  const credits = meta.credits;
  if (credits && typeof credits === 'object') {
    const c = credits as Record<string, unknown>;
    return {
      balance: typeof c.balance === 'number' ? c.balance : undefined,
      strictMode: typeof c.strictMode === 'boolean' ? c.strictMode : undefined,
    };
  }
  return {
    balance: typeof meta.creditBalance === 'number' ? meta.creditBalance : undefined,
    strictMode: meta.strictMode === true,
  };
}

export async function getProjectCreditSnapshot(
  projectId: string,
): Promise<ProjectCreditSnapshot> {
  let strictMode = false;
  try {
    const { data } = await CompanyMemoryService.getMemory(projectId);
    if (data.userPreferences?.strictMode === true) strictMode = true;
  } catch {
    /* ignore */
  }

  const wf = await findWorkflowScalars(projectId).catch(() => null);
  const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
  const fromMeta = readMetaCredits(meta);
  if (fromMeta.strictMode === true) strictMode = true;

  const project = await prisma.project
    .findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    })
    .catch(() => null);

  if (project?.organizationId) {
    try {
      const account = await prisma.creditAccount.findUnique({
        where: { organizationId: project.organizationId },
      });
      if (account) {
        const balance =
          typeof fromMeta.balance === 'number' ? fromMeta.balance : account.balance;
        return {
          balance,
          monthlyLimit: account.monthlyLimit,
          source: 'organization',
          strictMode,
          lowBalance: balance <= 5,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const balance =
    typeof fromMeta.balance === 'number' ? fromMeta.balance : DEFAULT_PROJECT_BALANCE;

  return {
    balance,
    monthlyLimit: null,
    source: typeof fromMeta.balance === 'number' ? 'project' : 'unknown',
    strictMode,
    lowBalance: balance <= 5,
  };
}

export async function setProjectPipelineSettings(
  projectId: string,
  update: { creditBalance?: number; strictMode?: boolean },
): Promise<ProjectCreditSnapshot> {
  const wf = await findWorkflowScalars(projectId);
  const meta = { ...((wf?.metadata as Record<string, unknown>) || {}) };
  const prev = readMetaCredits(meta);
  const nextCredits = {
    balance:
      typeof update.creditBalance === 'number'
        ? update.creditBalance
        : (prev.balance ?? DEFAULT_PROJECT_BALANCE),
    strictMode:
      typeof update.strictMode === 'boolean' ? update.strictMode : Boolean(prev.strictMode),
  };
  meta.credits = nextCredits;
  meta.strictMode = nextCredits.strictMode;
  meta.creditBalance = nextCredits.balance;

  if (wf) {
    await updateWorkflowScalars(projectId, { metadata: meta });
  }

  await CompanyMemoryService.updateMemory(projectId, {
    userPreferences: {
      strictMode: nextCredits.strictMode,
    },
  }).catch(() => {});

  // Mirror to org account when present
  if (typeof update.creditBalance === 'number') {
    const project = await prisma.project
      .findUnique({ where: { id: projectId }, select: { organizationId: true } })
      .catch(() => null);
    if (project?.organizationId) {
      await prisma.creditAccount
        .upsert({
          where: { organizationId: project.organizationId },
          create: {
            organizationId: project.organizationId,
            balance: update.creditBalance,
            monthlyLimit: 0,
          },
          update: { balance: update.creditBalance },
        })
        .catch(() => {});
    }
  }

  return getProjectCreditSnapshot(projectId);
}

export async function assertCreditsAvailable(projectId: string): Promise<void> {
  const snap = await getProjectCreditSnapshot(projectId);
  if (snap.balance != null && snap.balance <= 0) {
    throw new Error(
      '402 Insufficient credit balance — add credits, then Resume this step.',
    );
  }
}

export async function isStrictModeEnabled(projectId: string): Promise<boolean> {
  const snap = await getProjectCreditSnapshot(projectId);
  return snap.strictMode;
}
