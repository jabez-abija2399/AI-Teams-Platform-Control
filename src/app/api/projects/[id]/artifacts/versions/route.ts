import { NextRequest, NextResponse } from 'next/server';
import { ArtifactVersionService } from '@/core/artifacts/artifact-version.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const artifactType = searchParams.get('type') || undefined;

    const result = await ArtifactVersionService.getVersionHistory(projectId, artifactType);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const result = await ArtifactVersionService.saveDomainArtifact(
      projectId,
      body.artifactType,
      body.producerRole,
      body.content,
      body.summary,
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
