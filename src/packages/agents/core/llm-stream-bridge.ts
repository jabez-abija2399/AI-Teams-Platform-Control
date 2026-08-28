/**
 * @file llm-stream-bridge.ts
 * @package @ai-teams/agents/core
 * @description Provider-agnostic stream bridge formatting real-time SSE tokens for UI consumption.
 */

export interface StreamChunkPayload {
  type: 'TOKEN' | 'THOUGHT' | 'TOOL_CALL' | 'STATUS' | 'ERROR' | 'DONE';
  content?: string;
  toolName?: string;
  statusText?: string;
  progress?: number;
}

export class LLMStreamBridge {
  /**
   * Encodes a stream event into a standard Server-Sent Event string.
   */
  public static encodeSSE(payload: StreamChunkPayload): string {
    return `data: ${JSON.stringify(payload)}\n\n`;
  }

  /**
   * Helper to create a ReadableStream for Next.js Route Handlers.
   */
  public static createEventStream(
    producer: (emit: (payload: StreamChunkPayload) => void) => Promise<void>,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        const emit = (payload: StreamChunkPayload) => {
          controller.enqueue(encoder.encode(LLMStreamBridge.encodeSSE(payload)));
        };

        try {
          await producer(emit);
          emit({ type: 'DONE' });
        } catch (err) {
          emit({
            type: 'ERROR',
            content: err instanceof Error ? err.message : 'Streaming execution error',
          });
        } finally {
          controller.close();
        }
      },
    });
  }
}
