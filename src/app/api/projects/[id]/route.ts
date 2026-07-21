import { auth } from '@/lib/auth';
import {
  getProject,
  updateProject,
  deleteProject,
} from '@/features/projects/services/project.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const project = await getProject(id, session.user.id);
  if (!project) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND',
        },
      },
      { status: 404 },
    );
  }
  return NextResponse.json({
    success: true,
    data: project,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const result = await updateProject(id, session.user.id, body);
  return toResponse(result);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await deleteProject(id, session.user.id);
  return toResponse(result);
}
