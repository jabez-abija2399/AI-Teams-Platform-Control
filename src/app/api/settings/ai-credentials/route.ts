import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import {
  deleteAiCredential,
  getAiCredentialStatus,
  upsertAiCredential,
} from '@/features/ai-credentials/ai-credentials.service';
import { AI_PROVIDER_CATALOG } from '@/features/ai-credentials/ai-provider-catalog';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const status = await getAiCredentialStatus(session.user.id);
  return NextResponse.json({
    success: true,
    data: {
      status,
      providers: AI_PROVIDER_CATALOG,
    },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  let body: { provider?: string; apiKey?: string; defaultModel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await upsertAiCredential(session.user.id, {
    provider: body.provider ?? '',
    apiKey: body.apiKey ?? '',
    defaultModel: body.defaultModel,
  });
  return toResponse(result);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const result = await deleteAiCredential(session.user.id);
  return toResponse(result);
}
