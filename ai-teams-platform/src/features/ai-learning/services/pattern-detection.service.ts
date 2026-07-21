import { prisma } from '@/lib/prisma';

interface RecurringLesson {
  lesson: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
}

export async function detectRecurringLessons(
  agentId: string,
  minOccurrences: number = 3,
): Promise<RecurringLesson[]> {
  const records = await prisma.learningRecord.findMany({
    where: {
      agentId,
      lesson: { not: null },
    },
    orderBy: { createdAt: 'asc' },
  });

  const lessonCounts = new Map<
    string,
    { count: number; firstSeen: Date; lastSeen: Date }
  >();

  for (const record of records) {
    if (!record.lesson) continue;
    const normalized = record.lesson.trim().toLowerCase();
    const existing = lessonCounts.get(normalized);
    if (existing) {
      existing.count++;
      existing.lastSeen = record.createdAt;
    } else {
      lessonCounts.set(normalized, {
        count: 1,
        firstSeen: record.createdAt,
        lastSeen: record.createdAt,
      });
    }
  }

  const recurring: RecurringLesson[] = [];
  for (const [lesson, data] of lessonCounts) {
    if (data.count >= minOccurrences) {
      recurring.push({
        lesson,
        occurrences: data.count,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
      });
    }
  }

  return recurring.sort((a, b) => b.occurrences - a.occurrences);
}
