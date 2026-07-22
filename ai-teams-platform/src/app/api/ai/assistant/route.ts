import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { askCodeAssistant } from '@/features/code-assistant/services/assistant.service';
import { codeAssistantSchema } from '@/features/code-assistant/schemas/assistant.schema';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = codeAssistantSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const content = await askCodeAssistant(
      parsed.data.message,
      parsed.data.context,
      parsed.data.history,
    );

    const codeBlockMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);

    return NextResponse.json({
      success: true,
      data: {
        content,
        codeBlock: codeBlockMatch?.[2]?.trim(),
        language: codeBlockMatch?.[1] || undefined,
      },
    });
  } catch (error) {
    console.error('[Code Assistant] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'AI request failed',
          code: 'AI_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
