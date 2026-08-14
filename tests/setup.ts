/**
 * Global vitest setup — provides a stateful prisma mock so most tests don't
 * hit the real database.  Individual test files that call vi.mock('@/lib/prisma', …)
 * will override this automatically for their own module scope.
 */
import { vi } from 'vitest';

// In-memory store keyed by model name → array of records
const store = new Map<string, Map<string, Record<string, unknown>>>();

function getModelStore(model: string): Map<string, Record<string, unknown>> {
  if (!store.has(model)) store.set(model, new Map());
  return store.get(model)!;
}

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const modelHandler: ProxyHandler<Record<string, unknown>> = {
  get(_target, prop: string) {
    if (prop === 'findUnique') {
      return vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        const id = where?.id as string;
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        return Promise.resolve(id ? (s.get(id) ?? null) : null);
      });
    }
    if (prop === 'findFirst') {
      return vi.fn().mockImplementation(({ where }: { where?: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        const records = Array.from(s.values());
        if (!where || Object.keys(where).length === 0) return Promise.resolve(records[0] ?? null);
        const match = records.find((r) =>
          Object.entries(where).every(([k, v]) => r[k] === v),
        );
        return Promise.resolve(match ?? null);
      });
    }
    if (prop === 'findMany') {
      return vi.fn().mockImplementation(({ where, take, orderBy }: { where?: Record<string, unknown>; take?: number; orderBy?: Record<string, string> } = {}) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let records = Array.from(s.values());
        if (where && Object.keys(where).length > 0) {
          records = records.filter((r) =>
            Object.entries(where).every(([k, v]) => {
              if (v && typeof v === 'object' && 'in' in v) {
                return (v as { in: unknown[] }).in.includes(r[k]);
              }
              return r[k] === v;
            }),
          );
        }
        if (take) records = records.slice(0, take);
        return Promise.resolve(records);
      });
    }
    if (prop === 'create') {
      return vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        const id = (data.id as string) || generateId();
        const record = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        s.set(id, record);
        return Promise.resolve(record);
      });
    }
    if (prop === 'update') {
      return vi.fn().mockImplementation(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        const id = where?.id as string;
        const existing = s.get(id) ?? {};
        const updated = { ...existing, ...data, id };
        if (id) s.set(id, updated);
        return Promise.resolve(updated);
      });
    }
    if (prop === 'upsert') {
      return vi.fn().mockImplementation(({ where, create, update }: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        const id = (create.id as string) || where?.id as string || generateId();
        const existing = s.get(id);
        if (existing) {
          const updated = { ...existing, ...update, id };
          s.set(id, updated);
          return Promise.resolve(updated);
        }
        const record = { ...create, id, createdAt: new Date(), updatedAt: new Date() };
        s.set(id, record);
        return Promise.resolve(record);
      });
    }
    if (prop === 'delete') return vi.fn().mockResolvedValue({});
    if (prop === 'deleteMany') return vi.fn().mockResolvedValue({ count: 0 });
    if (prop === 'count') return vi.fn().mockResolvedValue(0);
    if (prop === 'findFirst') {
      return vi.fn().mockResolvedValue(null);
    }
    return vi.fn().mockResolvedValue(null);
  },
};

// Proxy that returns model proxies for any property access
const prismaProxy = new Proxy({} as Record<string, unknown>, {
  get(_target, prop: string) {
    if (prop.startsWith('$')) {
      return vi.fn().mockResolvedValue([]);
    }
    const modelProxy = new Proxy({}, modelHandler);
    // Tag the proxy so modelHandler can read the model name
    Object.defineProperty(modelProxy, '__modelName', { value: prop, configurable: true });
    return modelProxy;
  },
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaProxy,
}));
