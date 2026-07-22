import { NextRequest, NextResponse } from 'next/server';
import { analyzeProject } from '@/features/performance-profiler/services/profiler.service';

export async function POST(req: NextRequest) {
  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  }

  try {
    const report = await analyzeProject(projectId);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Analysis failed', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    );
  }
}
