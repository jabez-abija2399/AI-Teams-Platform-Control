import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { checkProjectAccess } from '@/lib/project-access';
import { ensureProjectExplorerFiles } from '@/features/workspace/explorer/services/ensure-explorer-files.service';

/**
 * Ensures Explorer has real project files for this projectId.
 * Honors confirmed stack when backfilling.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id: projectId } = await params;
  if (!projectId || projectId === 'undefined' || projectId === 'null') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid project id', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const access = await checkProjectAccess(projectId, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json(
      { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  try {
    const result = await ensureProjectExplorerFiles(projectId);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[explorer/ensure] Failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'Could not ensure files',
          code: 'ENSURE_FAILED',
        },
      },
      { status: 500 },
    );
  }
}
