/**
 * Smoke: force credits=0 → assert stops → add credits → assert passes.
 * Uses workflow metadata overrides (no live provider calls).
 */

import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  assertCreditsAvailable,
  getProjectCreditSnapshot,
  setProjectPipelineSettings,
} from '@/core/billing/project-credits';

const RUN = process.env.SMOKE_CREDITS === '1';

describe.runIf(RUN)('credits stop + resume smoke', () => {
  let projectId: string | null = null;

  afterAll(async () => {
    await prisma.$disconnect().catch(() => {});
  });

  it('picks a project and forces empty balance', async () => {
    const project = await prisma.project.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    expect(project).toBeTruthy();
    projectId = project!.id;

    const snap0 = await setProjectPipelineSettings(projectId, { creditBalance: 0 });
    expect(snap0.balance).toBe(0);

    await expect(assertCreditsAvailable(projectId)).rejects.toThrow(/402|credit/i);
  });

  it('adding credits clears the gate so Resume can continue', async () => {
    expect(projectId).toBeTruthy();
    const snap = await setProjectPipelineSettings(projectId!, { creditBalance: 50 });
    expect(snap.balance).toBe(50);
    await expect(assertCreditsAvailable(projectId!)).resolves.toBeUndefined();

    const check = await getProjectCreditSnapshot(projectId!);
    expect(check.balance).toBe(50);
    expect(check.lowBalance).toBe(false);
  });
});
