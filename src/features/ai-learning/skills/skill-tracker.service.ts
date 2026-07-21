import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

interface SkillUpdateResult {
  skill: string;
  level: number;
  previousLevel: number;
}

export async function updateSkillLevel(
  agentId: string,
  taskType: string,
  latestScore: number,
): Promise<ApiResult<SkillUpdateResult>> {
  const alpha = 0.3;

  const existing = await prisma.agentSkill.findUnique({
    where: { agentId_skill: { agentId, skill: taskType } },
  });

  const previousLevel = existing?.level ?? 50;
  const newLevel = Math.max(0, Math.min(100, previousLevel * (1 - alpha) + latestScore * alpha));

  const skill = await prisma.agentSkill.upsert({
    where: { agentId_skill: { agentId, skill: taskType } },
    create: { agentId, skill: taskType, level: newLevel },
    update: { level: newLevel },
  });

  return {
    success: true,
    data: {
      skill: skill.skill,
      level: skill.level,
      previousLevel,
    },
  };
}

export async function getAgentSkills(
  agentId: string,
): Promise<ApiResult<Array<{ skill: string; level: number }>>> {
  const skills = await prisma.agentSkill.findMany({
    where: { agentId },
    orderBy: { level: 'desc' },
  });

  return {
    success: true,
    data: skills.map((s) => ({ skill: s.skill, level: s.level })),
  };
}
