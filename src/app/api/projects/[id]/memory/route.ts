import { NextResponse } from 'next/server';
import { CompanyMemoryService } from '@/core/memory/company-memory.service';
import { MemoryTimelineService } from '@/core/memory/memory-timeline.service';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const projectId = params.id;
    const memory = await CompanyMemoryService.getMemory(projectId);
    const timeline = MemoryTimelineService.getTimeline(projectId);

    return NextResponse.json({
      success: true,
      memory: memory.data,
      version: memory.version,
      timeline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company memory' },
      { status: 500 }
    );
  }
}
