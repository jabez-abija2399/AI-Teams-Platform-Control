import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

const schema = z.object({ changeId: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'changeId required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const change = await prisma.codeGenerationRecord.findUnique({
    where: { id: parsed.data.changeId },
    include: { task: { select: { projectId: true } } },
  });
  if (!change) {
    return NextResponse.json(
      { success: false, error: { message: 'Change not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const repository = await prisma.repository.findUnique({
    where: { projectId: change.task.projectId },
  });
  if (!repository) {
    return NextResponse.json(
      { success: false, error: { message: 'Repository not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const file = await prisma.file.findFirst({
    where: { repositoryId: repository.id, path: change.file },
  });
  if (file) {
    await prisma.file.update({
      where: { id: file.id },
      data: { content: change.code },
    });
  }

  return NextResponse.json({
    success: true,
    data: { filePath: change.file, reverted: true },
  });
}
