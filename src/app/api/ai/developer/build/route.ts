import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiBuildQueue } from '@/lib/queues/ai-build.queue';

const buildRequestSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  userPrompt: z.string().min(1, 'userPrompt is required'),
  filesToGenerate: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string(),
      })
    )
    .optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = buildRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { projectId, userPrompt, filesToGenerate, userId } = validationResult.data;

    const jobName = `build-${projectId}-${Date.now()}`;
    const job = await aiBuildQueue.add(jobName, {
      projectId,
      userPrompt,
      filesToGenerate,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        status: 'QUEUED',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Failed to enqueue AI build job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error enqueuing build task',
      },
      { status: 500 }
    );
  }
}
