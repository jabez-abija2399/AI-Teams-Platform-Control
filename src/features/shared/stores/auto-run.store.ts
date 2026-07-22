const autoRunStore = new Map<string, Set<string>>();

export function hasAutoRun(projectId: string, agent: string): boolean {
  return autoRunStore.get(projectId)?.has(agent) ?? false;
}

export function markAutoRun(projectId: string, agent: string): void {
  if (!autoRunStore.has(projectId)) {
    autoRunStore.set(projectId, new Set());
  }
  autoRunStore.get(projectId)!.add(agent);
}
