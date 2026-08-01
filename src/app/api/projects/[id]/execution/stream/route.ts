import { NextRequest } from 'next/server';
import { getExecutionVisibilityService } from '@/core/execution-engine/visibility.service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'projectId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const visibilityService = getExecutionVisibilityService();

  const stream = new ReadableStream({
    start(controller) {
      const sendSSE = (event: string, data: Record<string, unknown>) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('[SSE Stream] Error enqueueing event payload:', err);
        }
      };

      // Send initial connection event
      sendSSE('connected', {
        projectId,
        message: 'Connected to Execution Pipeline Stream',
        timestamp: new Date().toISOString(),
      });

      // Listen for pipeline events
      const eventHandler = (data: unknown) => {
        sendSSE('pipeline_event', data as Record<string, unknown>);
      };

      const timelineHandler = (data: unknown) => {
        sendSSE('timeline_event', data as Record<string, unknown>);
      };

      const eventChannel = `project_event_${projectId}`;
      const timelineChannel = `project_timeline_${projectId}`;

      visibilityService.events.on(eventChannel, eventHandler);
      visibilityService.events.on(timelineChannel, timelineHandler);

      // Clean up resources on client disconnect
      req.signal.addEventListener('abort', () => {
        visibilityService.events.off(eventChannel, eventHandler);
        visibilityService.events.off(timelineChannel, timelineHandler);
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
