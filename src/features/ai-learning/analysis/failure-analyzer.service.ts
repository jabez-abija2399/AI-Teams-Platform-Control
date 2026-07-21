import { prisma } from '@/lib/prisma';
import { generateStructured } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

interface FailureAnalysis {
  rootCause: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  lesson: string;
  suggestedFix: string;
}

export async function analyzeFailure(
  agentId: string,
  taskDescription: string,
  errorOutput: string,
): Promise<ApiResult<{ id: string; lesson: string | null }>> {
  const result = await generateStructured<FailureAnalysis>(
    {
      messages: [
        {
          role: 'user',
          content: `Analyze this AI agent failure and provide structured output.

Task Description: ${taskDescription}

Error Output: ${errorOutput}

Identify the root cause, categorize the failure, assess severity, extract a lesson learned, and suggest a fix.`,
        },
      ],
      systemPrompt: 'You are an AI failure analyst. Return structured JSON with rootCause, category, severity (LOW/MEDIUM/HIGH), lesson, and suggestedFix fields.',
      temperature: 0.3,
    },
    { projectId: undefined },
  );

  if (!result.success) {
    const record = await prisma.learningRecord.create({
      data: {
        agentId,
        experience: `Failed: ${taskDescription}. Error: ${errorOutput.slice(0, 500)}`,
        result: 'FAILURE',
        lesson: null,
      },
    });
    return { success: true, data: { id: record.id, lesson: record.lesson } };
  }

  const analysis = result.data;

  const record = await prisma.learningRecord.create({
    data: {
      agentId,
      experience: `Failed: ${taskDescription}. Root cause: ${analysis.rootCause}. Category: ${analysis.category}. Severity: ${analysis.severity}.`,
      result: 'FAILURE',
      lesson: analysis.lesson,
    },
  });

  return {
    success: true,
    data: { id: record.id, lesson: record.lesson },
  };
}
