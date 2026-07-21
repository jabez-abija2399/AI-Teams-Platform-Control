import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTask, listTasks } from '@/features/projects/services/task.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const tasks = await listTasks(id, session.user.id);
  if (tasks === null) {
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
    data: tasks,
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const result = await createTask(id, session.user.id, body);
  return toResponse(result, 201);
}
