import { prisma } from '@/lib/prisma';

const SEVERITY_PENALTIES: Record<string, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 1,
};

export async function calculateSecurityScore(projectId: string): Promise<number> {
  const issues = await prisma.securityIssue.findMany({
    where: { projectId, status: { not: 'RESOLVED' } },
    select: { severity: true },
  });

  let score = 100;

  for (const issue of issues) {
    const penalty = SEVERITY_PENALTIES[issue.severity] ?? 0;
    score -= penalty;
  }

  return Math.max(0, Math.min(100, score));
}
