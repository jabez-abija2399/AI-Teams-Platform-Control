import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getAgentAverageScore } from '@/features/ai-learning/evaluation/performance-evaluator.service';
import { getAgentSkills } from '@/features/ai-learning/skills/skill-tracker.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, role: true, status: true },
  });

  const agentData = await Promise.all(
    agents.map(async (agent) => {
      const [avgScore, skills] = await Promise.all([
        getAgentAverageScore(agent.id),
        getAgentSkills(agent.id),
      ]);

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        averageScore: avgScore.success ? avgScore.data.average : 0,
        evaluationCount: avgScore.success ? avgScore.data.count : 0,
        skills: skills.success ? skills.data : [],
      };
    }),
  );

  return NextResponse.json({ success: true, data: agentData });
}
