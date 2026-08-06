import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { setProjectPipelineSettings } from '@/core/billing/project-credits';
import { checkProjectAccess } from '@/lib/project-access';

/**
 * Update project pipeline settings: credit balance (demo/smoke) + strict mode.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      );
    }

    const { id: projectId } = await params;
    const access = await checkProjectAccess(projectId, session.user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      creditBalance?: number;
      strictMode?: boolean;
    };

    const update: { creditBalance?: number; strictMode?: boolean } = {};
    if (typeof body.creditBalance === 'number' && Number.isFinite(body.creditBalance)) {
      update.creditBalance = Math.max(0, Math.floor(body.creditBalance));
    }
    if (typeof body.strictMode === 'boolean') {
      update.strictMode = body.strictMode;
    }

    if (update.creditBalance === undefined && update.strictMode === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Provide creditBalance and/or strictMode', code: 'BAD_REQUEST' },
        },
        { status: 400 },
      );
    }

    const snap = await setProjectPipelineSettings(projectId, update);
    return NextResponse.json({
      success: true,
      data: {
        credits: {
          balance: snap.balance,
          monthlyLimit: snap.monthlyLimit,
          source: snap.source,
          lowBalance: snap.lowBalance,
        },
        strictMode: snap.strictMode,
      },
    });
  } catch (error: any) {
    console.error('[Pipeline Settings] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error?.message || 'Failed to update settings', code: 'INTERNAL_ERROR' },
      },
      { status: 500 },
    );
  }
}
