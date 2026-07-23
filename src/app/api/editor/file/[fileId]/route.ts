import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { fileId } = await params;

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json(
      { success: false, error: { message: 'File not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      fileId: file.id,
      content: file.content,
      language: file.language ?? 'plaintext',
      path: file.path,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { fileId } = await params;
  const body = await request.json();
  const { content } = body;

  if (typeof content !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid content', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json(
      { success: false, error: { message: 'File not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  await prisma.file.update({
    where: { id: fileId },
    data: { content, language: file.language },
  });

  return NextResponse.json({ success: true, data: { fileId: file.id } });
}
