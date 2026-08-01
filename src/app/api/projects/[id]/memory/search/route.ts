import { NextResponse } from 'next/server';
import { KnowledgeSearchService } from '@/core/memory/knowledge-search.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || 'architecture decision';

    const result = await KnowledgeSearchService.queryKnowledge(projectId, q);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search knowledge' },
      { status: 500 }
    );
  }
}
