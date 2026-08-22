import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id: projectId } = await params;
  const state = await ProjectStateManager.getState(projectId);

  // Load latest artifacts
  const prd = await ArtifactRegistryService.getLatestArtifact(projectId, 'PRODUCT_REQUIREMENTS_DOC');
  const arch = await ArtifactRegistryService.getLatestArtifact(projectId, 'ARCHITECTURE_SPECIFICATION');
  const design = await ArtifactRegistryService.getLatestArtifact(projectId, 'UI_DESIGN_SPECIFICATION');
  const impl = await ArtifactRegistryService.getLatestArtifact(projectId, 'IMPLEMENTATION_DELIVERABLE');
  const qa = await ArtifactRegistryService.getLatestArtifact(projectId, 'QA_VERIFICATION_REPORT');

  return NextResponse.json({
    success: true,
    data: {
      state,
      artifacts: {
        prd: prd?.metadata,
        arch: arch?.metadata,
        design: design?.metadata,
        impl: impl?.metadata,
        qa: qa?.metadata,
      },
    },
  });
}
