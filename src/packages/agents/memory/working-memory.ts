/**
 * @file working-memory.ts
 * @package @ai-teams/agents/memory
 * @description Transient in-memory scratchpad maintaining agent reasoning state across tool loops.
 */

export class WorkingMemory {
  private store = new Map<string, unknown>();

  public set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  public get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public toJSON(): Record<string, unknown> {
    return Object.fromEntries(this.store.entries());
  }
}
