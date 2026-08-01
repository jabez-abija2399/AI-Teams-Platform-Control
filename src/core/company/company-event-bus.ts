import type { CompanyEvent, CompanyEventType, CompanyEventListener } from './types';
import { CompanyEvents } from './company-events';

export class CompanyEventBus {
  private static listeners: Map<string, Set<CompanyEventListener<any>>> = new Map();
  private static history: CompanyEvent<any>[] = [];
  private static maxHistory = 5000;

  public static async publish<T = Record<string, any>>(
    type: CompanyEventType,
    projectId: string,
    payload: T = {} as T,
    source: string = 'CompanyOrchestrator'
  ): Promise<CompanyEvent<T>> {
    const event = CompanyEvents.createEvent<T>(type, projectId, payload, source);

    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    const typeListeners = this.listeners.get(type) || new Set();
    const wildcardListeners = this.listeners.get('*') || new Set();
    const allListeners = [...typeListeners, ...wildcardListeners];

    // Execute listeners asynchronously and fault-tolerantly
    await Promise.all(
      allListeners.map(async (listener) => {
        try {
          await listener(event);
        } catch (err) {
          console.error(`[CompanyEventBus] Error in listener for event ${type} (${event.id}):`, err);
        }
      })
    );

    return event;
  }

  public static subscribe<T = Record<string, any>>(
    type: CompanyEventType | '*',
    listener: CompanyEventListener<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as CompanyEventListener<any>);

    return () => {
      const set = this.listeners.get(type);
      if (set) {
        set.delete(listener as CompanyEventListener<any>);
        if (set.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  public static getHistory(
    projectId?: string,
    type?: CompanyEventType,
    limit: number = 100
  ): CompanyEvent<any>[] {
    return this.history
      .filter((evt) => {
        if (projectId && evt.projectId !== projectId) return false;
        if (type && evt.type !== type) return false;
        return true;
      })
      .slice(0, limit);
  }

  public static getLatestEvent(projectId?: string, type?: CompanyEventType): CompanyEvent<any> | undefined {
    const history = this.getHistory(projectId, type, 1);
    return history[0];
  }

  public static clearHistory(projectId?: string): void {
    if (projectId) {
      this.history = this.history.filter((evt) => evt.projectId !== projectId);
    } else {
      this.history = [];
    }
  }

  public static resetListeners(): void {
    this.listeners.clear();
  }
}
