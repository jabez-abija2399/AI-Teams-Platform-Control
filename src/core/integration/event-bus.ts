import type { CompanyEvent, CompanyEventType, EventListener } from './integration.types';

export class CompanyEventBus {
  private listeners: Map<string, Set<EventListener<any>>> = new Map();
  private history: CompanyEvent<any>[] = [];
  private maxHistory = 1000;

  public async publish<T = Record<string, any>>(
    type: CompanyEventType,
    projectId: string,
    payload: T = {} as T,
    source: string = 'system',
  ): Promise<CompanyEvent<T>> {
    const event: CompanyEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      projectId,
      timestamp: Date.now(),
      payload,
      source,
    };

    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    const typeListeners = this.listeners.get(type) || new Set();
    const wildcardListeners = this.listeners.get('*') || new Set();
    const allListeners = [...typeListeners, ...wildcardListeners];

    await Promise.all(
      allListeners.map(async (listener) => {
        try {
          await listener(event);
        } catch (err) {
          console.error(`[EventBus] Error in listener for event ${type} (${event.id}):`, err);
        }
      }),
    );

    return event;
  }

  public subscribe<T = Record<string, any>>(
    type: CompanyEventType | '*',
    listener: EventListener<T>,
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as EventListener<any>);

    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(listener as EventListener<any>);
        if (set.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  public getHistory(
    projectId?: string,
    type?: CompanyEventType,
    limit: number = 50,
  ): CompanyEvent<any>[] {
    return this.history
      .filter((evt) => {
        if (projectId && evt.projectId !== projectId) return false;
        if (type && evt.type !== type) return false;
        return true;
      })
      .slice(0, limit);
  }

  public clearHistory(projectId?: string): void {
    if (projectId) {
      this.history = this.history.filter((evt) => evt.projectId !== projectId);
    } else {
      this.history = [];
    }
  }

  public resetListeners(): void {
    this.listeners.clear();
  }
}

export const companyEventBus = new CompanyEventBus();
