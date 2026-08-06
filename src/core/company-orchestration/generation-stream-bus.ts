/**
 * In-memory generation token bus for Mission Control SSE.
 * Publishes true LLM tokens (and narrative chunks) to connected clients.
 */

export type GenerationStreamEvent =
  | { type: 'token'; content: string; at: number }
  | { type: 'status'; message: string; at: number }
  | { type: 'usage'; promptTokens: number; completionTokens: number; totalTokens: number; at: number }
  | { type: 'done'; at: number }
  | { type: 'error'; message: string; at: number };

type Listener = (event: GenerationStreamEvent) => void;

interface ProjectStream {
  listeners: Set<Listener>;
  recent: GenerationStreamEvent[];
  buffer: string;
}

const streams = new Map<string, ProjectStream>();
const MAX_RECENT = 80;

function ensure(projectId: string): ProjectStream {
  let s = streams.get(projectId);
  if (!s) {
    s = { listeners: new Set(), recent: [], buffer: '' };
    streams.set(projectId, s);
  }
  return s;
}

function emit(projectId: string, event: GenerationStreamEvent): void {
  const s = ensure(projectId);
  s.recent.push(event);
  if (s.recent.length > MAX_RECENT) s.recent.splice(0, s.recent.length - MAX_RECENT);
  if (event.type === 'token' && event.content) {
    s.buffer = (s.buffer + event.content).slice(-4000);
  }
  if (event.type === 'done' || event.type === 'error') {
    // keep buffer for UI until next clear
  }
  for (const listener of s.listeners) {
    try {
      listener(event);
    } catch {
      /* ignore listener errors */
    }
  }
}

export function subscribeGenerationStream(
  projectId: string,
  listener: Listener,
): () => void {
  const s = ensure(projectId);
  s.listeners.add(listener);
  return () => {
    s.listeners.delete(listener);
  };
}

export function getGenerationBuffer(projectId: string): string {
  return ensure(projectId).buffer;
}

export function getRecentGenerationEvents(projectId: string): GenerationStreamEvent[] {
  return [...ensure(projectId).recent];
}

export function clearGenerationStream(projectId: string): void {
  const s = ensure(projectId);
  s.buffer = '';
  s.recent = [];
}

export function publishGenerationToken(projectId: string, content: string): void {
  if (!content) return;
  emit(projectId, { type: 'token', content, at: Date.now() });
}

export function publishGenerationStatus(projectId: string, message: string): void {
  emit(projectId, { type: 'status', message, at: Date.now() });
}

export function publishGenerationUsage(
  projectId: string,
  usage: { promptTokens: number; completionTokens: number; totalTokens: number },
): void {
  emit(projectId, { type: 'usage', ...usage, at: Date.now() });
}

export function publishGenerationDone(projectId: string): void {
  emit(projectId, { type: 'done', at: Date.now() });
}

export function publishGenerationError(projectId: string, message: string): void {
  emit(projectId, { type: 'error', message, at: Date.now() });
}

/** Stream a sentence as small chunks so the UI feels live even on heuristic paths. */
export async function publishNarrativeStream(
  projectId: string,
  text: string,
  opts?: { chunkMs?: number },
): Promise<void> {
  const words = text.split(/(\s+)/).filter(Boolean);
  const delay = opts?.chunkMs ?? 18;
  for (const word of words) {
    publishGenerationToken(projectId, word);
    await new Promise((r) => setTimeout(r, delay));
  }
}
