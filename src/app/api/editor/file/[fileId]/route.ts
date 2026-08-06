import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/project-access';

/**
 * Load / save a project file by id.
 * Never falls back to the AI Teams Platform source tree — that leaked
 * unrelated files into Explorer/Preview for empty or switched projects.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { fileId } = await params;
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!fileId || fileId.startsWith('virt_')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'File is not part of this project workspace',
          code: 'NOT_FOUND',
        },
      },
      { status: 404 },
    );
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        repository: { select: { projectId: true } },
      },
    });

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'File not found in this project', code: 'NOT_FOUND' },
        },
        { status: 404 },
      );
    }

    const ownerProjectId = file.repository.projectId;
    if (projectId && projectId !== ownerProjectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'File belongs to a different project',
            code: 'WRONG_PROJECT',
          },
        },
        { status: 403 },
      );
    }

    const access = await checkProjectAccess(ownerProjectId, session.user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: file.id,
        content: file.content,
        language: file.language ?? 'typescript',
        path: file.path,
        reviewStatus: file.reviewStatus ?? 'accepted',
        projectId: ownerProjectId,
      },
    });
  } catch (err) {
    console.error('[editor/file] GET failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Could not load file', code: 'LOAD_FAILED' },
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { fileId } = await params;
  const body = await request.json().catch(() => null);
  const content = body?.content;
  const projectId =
    typeof body?.projectId === 'string' ? body.projectId : null;

  if (typeof content !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid content', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  if (!fileId || fileId.startsWith('virt_')) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Cannot save virtual/non-project file', code: 'NOT_FOUND' },
      },
      { status: 404 },
    );
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { repository: { select: { projectId: true } } },
    });

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'File not found in this project', code: 'NOT_FOUND' },
        },
        { status: 404 },
      );
    }

    const ownerProjectId = file.repository.projectId;
    if (projectId && projectId !== ownerProjectId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'File belongs to a different project', code: 'WRONG_PROJECT' },
        },
        { status: 403 },
      );
    }

    const access = await checkProjectAccess(ownerProjectId, session.user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      );
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { content, language: file.language },
    });

    return NextResponse.json({
      success: true,
      data: { fileId: file.id, projectId: ownerProjectId },
    });
  } catch (err) {
    console.error('[editor/file] PUT failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Could not save file', code: 'SAVE_FAILED' },
      },
      { status: 500 },
    );
  }
}
