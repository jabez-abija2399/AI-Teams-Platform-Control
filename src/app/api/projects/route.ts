import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createProject, listProjects } from '@/features/projects/services/project.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const projects = await listProjects(session.user.id);
    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error: any) {
    console.error('[API Projects GET] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Failed to list projects', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await request.json();
    const result = await createProject(session.user.id, body);
    return toResponse(result, 201);
  } catch (error: any) {
    console.error('[API Projects POST] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Failed to create project', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
