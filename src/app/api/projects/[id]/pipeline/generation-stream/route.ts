import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getRecentGenerationEvents,
  subscribeGenerationStream,
  type GenerationStreamEvent,
} from '@/core/company-orchestration/generation-stream-bus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * SSE: true generation tokens for Mission Control live panel.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const { id: projectId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send('connected', { projectId, at: Date.now() });

      for (const recent of getRecentGenerationEvents(projectId)) {
        send('generation', recent);
      }

      const unsubscribe = subscribeGenerationStream(
        projectId,
        (evt: GenerationStreamEvent) => {
          try {
            send('generation', evt);
          } catch {
            unsubscribe();
          }
        },
      );

      const heartbeat = setInterval(() => {
        try {
          send('ping', { at: Date.now() });
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      _request.signal.addEventListener('abort', close);
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
