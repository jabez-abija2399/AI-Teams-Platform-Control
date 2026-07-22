import { prisma } from '@/lib/prisma';

export const ONBOARDING_EVENTS = {
  IDEA_SUBMITTED: 'onboarding.idea_submitted',
  SAMPLE_SELECTED: 'onboarding.sample_selected',
  WATCHING_COMPLETE: 'onboarding.watching_complete',
  BUILD_CLICKED: 'onboarding.build_clicked',
  BUILD_SKIPPED: 'onboarding.build_skipped',
  BUILD_COMPLETED: 'onboarding.build_completed',
  WORKSPACE_OPENED: 'onboarding.workspace_opened',
} as const;

export async function trackOnboardingStep(
  projectId: string,
  event: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.platformEvent.create({
    data: {
      projectId,
      type: event,
      source: 'onboarding',
      ...(metadata ? { data: JSON.parse(JSON.stringify(metadata)) } : {}),
    },
  });
}

export interface OnboardingFunnel {
  ideaSubmitted: number;
  watchingComplete: number;
  buildClicked: number;
  buildSkipped: number;
  buildCompleted: number;
  workspaceOpened: number;
}

export async function getOnboardingFunnel(since: Date): Promise<OnboardingFunnel> {
  const events = await prisma.platformEvent.findMany({
    where: { type: { startsWith: 'onboarding.' }, createdAt: { gte: since } },
  });

  const count = (type: string) => events.filter((e) => e.type === type).length;

  return {
    ideaSubmitted: count(ONBOARDING_EVENTS.IDEA_SUBMITTED),
    watchingComplete: count(ONBOARDING_EVENTS.WATCHING_COMPLETE),
    buildClicked: count(ONBOARDING_EVENTS.BUILD_CLICKED),
    buildSkipped: count(ONBOARDING_EVENTS.BUILD_SKIPPED),
    buildCompleted: count(ONBOARDING_EVENTS.BUILD_COMPLETED),
    workspaceOpened: count(ONBOARDING_EVENTS.WORKSPACE_OPENED),
  };
}
