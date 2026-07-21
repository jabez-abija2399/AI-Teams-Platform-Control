import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserProfile, updateUserProfile } from '@/features/auth/services/user.service';
import { unauthorizedResponse } from '@/lib/api-response';
import { updateProfileSchema } from '@/features/settings/schemas/settings.schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const profile = await getUserProfile(session.user.id);
  return NextResponse.json({
    success: true,
    data: profile,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
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

  const updated = await updateUserProfile(session.user.id, parsed.data);
  return NextResponse.json({
    success: true,
    data: updated,
  });
}
