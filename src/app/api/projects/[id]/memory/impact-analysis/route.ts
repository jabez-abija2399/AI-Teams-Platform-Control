import { NextResponse } from 'next/server';
import { ChangeImpactAnalyzer } from '@/core/memory/change-impact-analyzer';

export async function POST(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    const analysis = await ChangeImpactAnalyzer.analyzeImpact(projectId, body.changeDescription || '');

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze impact' },
      { status: 500 }
    );
  }
}
