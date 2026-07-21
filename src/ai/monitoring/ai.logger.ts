export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const logStore: LogEntry[] = [];

export function log(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    level,
    source,
    message,
    metadata,
    timestamp: new Date(),
  };
  logStore.push(entry);

  if (logStore.length > 1000) {
    logStore.splice(0, logStore.length - 1000);
  }
}

export async function logAIEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  agentId?: string,
): Promise<void> {
  log('info', agentId ? `agent:${agentId}` : 'system', eventType, metadata);
}

export function getLogs(filter?: {
  level?: LogLevel;
  source?: string;
  limit?: number;
}): LogEntry[] {
  let results = [...logStore];

  if (filter?.level) {
    results = results.filter((e) => e.level === filter.level);
  }
  if (filter?.source) {
    results = results.filter((e) => e.source === filter.source);
  }

  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (filter?.limit) {
    results = results.slice(0, filter.limit);
  }

  return results;
}
