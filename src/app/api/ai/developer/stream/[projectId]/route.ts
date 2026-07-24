import { NextRequest } from 'next/server';
import { QueueEvents } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { AI_BUILD_QUEUE_NAME } from '@/lib/queues/ai-build.queue';
import { AIBuildProgress } from '@/workers/developer-agent.worker';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'projectId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const queueEvents = new QueueEvents(AI_BUILD_QUEUE_NAME, {
        connection: redisConnection,
      });

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
        message: 'Connected to AI Build Stream Gateway',
        timestamp: new Date().toISOString(),
      });

      // Handler for progress updates
      const onProgress = ({
        jobId,
        data,
      }: {
        jobId: string;
        data: unknown;
      }) => {
        if (typeof data === 'object' && data !== null && (data as AIBuildProgress).projectId === projectId) {
          sendSSE('progress', {
            jobId,
            ...(data as AIBuildProgress),
          });
        }
      };

      // Handler for completion updates
      const onCompleted = ({
        jobId,
        returnvalue,
      }: {
        jobId: string;
        returnvalue: unknown;
      }) => {
        sendSSE('completed', {
          jobId,
          projectId,
          status: 'COMPLETED',
          result: returnvalue,
          percent: 100,
        });
      };

      // Handler for failed jobs
      const onFailed = ({
        jobId,
        failedReason,
      }: {
        jobId: string;
        failedReason: string;
      }) => {
        sendSSE('failed', {
          jobId,
          projectId,
          status: 'FAILED',
          failedReason,
        });
      };

      queueEvents.on('progress', onProgress);
      queueEvents.on('completed', onCompleted);
      queueEvents.on('failed', onFailed);

      // Clean up resources on client disconnect
      req.signal.addEventListener('abort', async () => {
        queueEvents.off('progress', onProgress);
        queueEvents.off('completed', onCompleted);
        queueEvents.off('failed', onFailed);
        await queueEvents.close();
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
