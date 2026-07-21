import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createProject, listProjects } from '@/features/projects/services/project.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const projects = await listProjects(session.user.id);
  return NextResponse.json({
    success: true,
    data: projects,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const result = await createProject(session.user.id, body);
  return toResponse(result, 201);
}
