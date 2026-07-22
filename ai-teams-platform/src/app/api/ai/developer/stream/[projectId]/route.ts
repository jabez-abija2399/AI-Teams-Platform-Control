import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { subscribeToBuild, getBuildState } from '@/ai/agents/roles/developer/developer.service';
import type { BuildEvent } from '@/ai/agents/roles/developer/developer.types';

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const { projectId } = await params;

  // Check if build exists
  const state = getBuildState(projectId);
  if (!state) {
    return NextResponse.json({ success: false, error: { message: 'No active build for this project', code: 'NOT_FOUND' } }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      const currentEvent = `data: ${JSON.stringify(state.progress)}\n\n`;
      controller.enqueue(encoder.encode(currentEvent));

      // Subscribe to future events
      const unsubscribe = subscribeToBuild(projectId, (event: BuildEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));

        if (event.phase === 'complete') {
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
          unsubscribe();
        }
      });

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
