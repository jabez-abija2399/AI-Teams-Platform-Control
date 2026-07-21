import { prisma } from '@/lib/prisma';
import { generateStructured } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

interface StoryData {
  title: string;
  description: string;
  criteria: string[];
  priority: string;
}

interface CreatedUserStory {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  criteria: string[];
  priority: string;
  createdAt: Date;
}

export async function generateUserStories(
  requirementId: string,
  agentId: string,
  projectId: string,
): Promise<ApiResult<CreatedUserStory[]>> {
  const requirement = await prisma.requirement.findFirst({ where: { id: requirementId } });
  if (!requirement) {
    return { success: false, error: { message: 'Requirement not found', code: 'NOT_FOUND' } };
  }

  const result = await generateStructured<{ stories: StoryData[] }>(
    {
      messages: [
        {
          role: 'user',
          content: `Break down this requirement into user stories using the standard format "As a [user], I want [action], so that [benefit]". Each story should have a clear title, description, acceptance criteria (array of strings), and priority (LOW, MEDIUM, HIGH, URGENT).\n\nRequirement: ${requirement.title}\nDescription: ${requirement.description}\nCategory: ${requirement.category}`,
        },
      ],
      systemPrompt:
        'You are an experienced product owner. Create well-defined user stories with clear acceptance criteria. Return JSON with a "stories" array.',
    },
    { projectId },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const storiesData = result.data.stories ?? [];

  const created = await prisma.$transaction(
    storiesData.map((story) =>
      prisma.userStory.create({
        data: {
          requirementId,
          title: story.title,
          description: story.description,
          criteria: story.criteria ?? [],
          priority: story.priority || requirement.priority,
        },
      }),
    ),
  );

  return { success: true, data: created };
}
