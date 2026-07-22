import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

const prefsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  layout: z.record(z.string(), z.unknown()),
  simpleMode: z.boolean().optional(),
  tourCompleted: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const prefs = await prisma.workspacePreference.findFirst({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ success: true, data: prefs });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Invalid input', code: 'VALIDATION_ERROR' },
      },
      { status: 400 },
    );
  }

  const prefs = await prisma.workspacePreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      theme: parsed.data.theme,
      simpleMode: parsed.data.simpleMode ?? true,
      tourCompleted: parsed.data.tourCompleted ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout: parsed.data.layout as any,
    },
    update: {
      theme: parsed.data.theme,
      ...(parsed.data.simpleMode !== undefined && { simpleMode: parsed.data.simpleMode }),
      ...(parsed.data.tourCompleted !== undefined && { tourCompleted: parsed.data.tourCompleted }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layout: parsed.data.layout as any,
    },
  });
  return NextResponse.json({ success: true, data: prefs });
}
