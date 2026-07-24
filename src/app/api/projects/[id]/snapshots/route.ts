import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveProjectSnapshot, getProjectHistory } from '@/lib/db/project-service';

const createSnapshotSchema = z.object({
  commitMessage: z.string().min(1, 'commitMessage is required'),
  files: z.record(z.string(), z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const validation = createSnapshotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { commitMessage, files } = validation.data;
    const snapshot = await saveProjectSnapshot(projectId, files, commitMessage);

    return NextResponse.json({ success: true, snapshot }, { status: 201 });
  } catch (error) {
    console.error('[API Snapshots] POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create snapshot' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const snapshots = await getProjectHistory(projectId);
    return NextResponse.json({ success: true, snapshots });
  } catch (error) {
    console.error('[API Snapshots] GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch snapshot history' }, { status: 500 });
  }
}
