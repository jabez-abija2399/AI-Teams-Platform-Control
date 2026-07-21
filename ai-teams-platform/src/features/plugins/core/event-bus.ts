type Handler = (payload: unknown) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  subscribe(event: string, handler: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  publish(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
    this.handlers.get('*')?.forEach((h) => h(payload));
  }
}

export const eventBus = new EventBus();

export const PLATFORM_EVENTS = {
  PROJECT_CREATED: 'project.created',
  CODE_GENERATED: 'code.generated',
  COMMIT_CREATED: 'git.commit.created',
  DEPLOYMENT_COMPLETED: 'deployment.completed',
  TASK_FINISHED: 'task.finished',
} as const;
