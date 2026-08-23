import { prisma } from '@/lib/prisma';

export type MissionStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'WAITING_FOR_APPROVAL'
  | 'COMPLETED'
  | 'FAILED';

export interface MissionData {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: MissionStatus;
  currentPhase: string;
  checkpoint?: string | null;
  attempt: number;
  budgetUsd: number;
  usedTokens: number;
  usedCostUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MissionService {
  public static async getOrCreateActiveMission(params: {
    projectId: string;
    title?: string;
    description?: string;
    budgetUsd?: number;
  }): Promise<MissionData> {
    const { projectId, title = 'Build MVP', description, budgetUsd = 5.0 } = params;

    const existing = await prisma.mission.findFirst({
      where: {
        projectId,
        status: { in: ['PLANNING', 'IN_PROGRESS', 'WAITING_FOR_APPROVAL', 'PAUSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return {
        ...existing,
        budgetUsd: existing.budgetUsd ?? 5.0,
      };
    }

    const created = await prisma.mission.create({
      data: {
        projectId,
        title,
        description,
        status: 'IN_PROGRESS',
        currentPhase: 'REQUIREMENTS',
        attempt: 1,
        budgetUsd,
      },
    });

    return {
      ...created,
      budgetUsd: created.budgetUsd ?? 5.0,
    };
  }

  public static async saveCheckpoint(params: {
    missionId: string;
    phase: string;
    checkpointState: Record<string, unknown>;
  }): Promise<void> {
    const { missionId, phase, checkpointState } = params;
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        currentPhase: phase,
        checkpoint: JSON.stringify(checkpointState),
        status: 'IN_PROGRESS',
      },
    }).catch(() => {});
  }

  public static async completeMission(missionId: string): Promise<void> {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        status: 'COMPLETED',
      },
    }).catch(() => {});
  }

  public static async failMission(missionId: string, errorReason: string): Promise<void> {
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        status: 'FAILED',
        description: errorReason,
      },
    }).catch(() => {});
  }
}
