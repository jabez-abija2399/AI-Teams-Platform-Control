import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import {
  testAiCredential,
  resolveUserAiCredential,
} from '@/features/ai-credentials/ai-credentials.service';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  let body: { provider?: string; apiKey?: string; defaultModel?: string } = {};
  try {
    body = await request.json();
  } catch {}

  let provider = body.provider;
  let apiKey = body.apiKey;
  let defaultModel = body.defaultModel;

  // If no apiKey in request, only test with saved credential if provider matches
  if (!apiKey) {
    const saved = await resolveUserAiCredential(session.user.id);
    if (!saved) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No API key provided to test. Please enter your key.', code: 'VALIDATION_ERROR' },
        },
        { status: 400 },
      );
    }
    if (provider && saved.provider !== provider) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Please enter your ${provider} API key before testing.`, code: 'VALIDATION_ERROR' },
        },
        { status: 400 },
      );
    }
    provider = saved.provider;
    apiKey = saved.apiKey;
    defaultModel = saved.defaultModel;
  }

  const result = await testAiCredential({
    provider: provider ?? '',
    apiKey: apiKey ?? '',
    defaultModel,
  });

  return toResponse(result);
}
