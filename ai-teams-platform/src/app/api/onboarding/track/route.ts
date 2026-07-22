import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { trackOnboardingStep } from '@/features/onboarding/services/onboarding-analytics.service';
import { unauthorizedResponse } from '@/lib/api-response';

const schema = z.object({
  projectId: z.string(),
  event: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  await trackOnboardingStep(parsed.data.projectId, parsed.data.event, parsed.data.metadata);
  return NextResponse.json({ success: true });
}
