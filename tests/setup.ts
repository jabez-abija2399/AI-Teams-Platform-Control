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
      return vi.fn().mockImplementation(({ where, include }: { where: Record<string, unknown>; include?: Record<string, any> }) => {
        const id = where?.id as string;
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let record = id ? (s.get(id) ?? null) : null;
        if (!record && where) {
          record = Array.from(s.values()).find((r) =>
            Object.entries(where).every(([k, v]) => r[k] === v),
          ) ?? null;
        }
        if (record) {
          if (include?.execution && record.executionId) {
            const execStore = getModelStore('projectExecution');
            record = { ...record, execution: execStore.get(record.executionId as string) || { id: record.executionId, projectId: 'mock-proj' } };
          }
          if (include?.projectExecutions) {
            const execStore = getModelStore('projectExecution');
            const taskStore = getModelStore('executionTask');
            const execs = Array.from(execStore.values())
              .filter((e) => e.projectId === record.id)
              .map((e) => {
                const tasks = Array.from(taskStore.values()).filter((t) => t.executionId === e.id);
                return { ...e, tasks };
              });
            record = { ...record, projectExecutions: execs };
          }
        }
        return Promise.resolve(record);
      });
    }
    if (prop === 'findFirst') {
      return vi.fn().mockImplementation(({ where, include }: { where?: Record<string, unknown>; include?: Record<string, any> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let records = Array.from(s.values());
        if (!where || Object.keys(where).length === 0) {
          let rec = records[0] ?? null;
          if (rec && include?.execution && rec.executionId) {
            const execStore = getModelStore('projectExecution');
            rec = { ...rec, execution: execStore.get(rec.executionId as string) || { id: rec.executionId, projectId: 'mock-proj' } };
          }
          return Promise.resolve(rec);
        }
        let match = records.find((r) => {
          if (Array.isArray(where.OR)) {
            return where.OR.some((subWhere: Record<string, unknown>) =>
              Object.entries(subWhere).every(([k, v]) => r[k] === v),
            );
          }
          return Object.entries(where).every(([k, v]) => {
            if (k === 'execution' && v && typeof v === 'object' && 'projectId' in v) {
              const execStore = getModelStore('projectExecution');
              const exec = execStore.get(r.executionId as string) as Record<string, unknown> | undefined;
              return exec?.projectId === (v as { projectId: string }).projectId;
            }
            return r[k] === v;
          });
        }) ?? null;
        if (match && include?.execution && match.executionId) {
          const execStore = getModelStore('projectExecution');
          match = { ...match, execution: execStore.get(match.executionId as string) || { id: match.executionId, projectId: 'mock-proj' } };
        }
        return Promise.resolve(match);
      });
    }
    if (prop === 'findMany') {
      return vi.fn().mockImplementation(({ where, take, orderBy, include }: { where?: Record<string, unknown>; take?: number; orderBy?: Record<string, string>; include?: Record<string, any> } = {}) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let records = Array.from(s.values());
        if (where && Object.keys(where).length > 0) {
          records = records.filter((r) =>
            Object.entries(where).every(([k, v]) => {
              if (k === 'execution' && v && typeof v === 'object' && 'projectId' in v) {
                const execStore = getModelStore('projectExecution');
                const exec = execStore.get(r.executionId as string) as Record<string, unknown> | undefined;
                return exec?.projectId === (v as { projectId: string }).projectId;
              }
              if (k === 'task' && v && typeof v === 'object' && 'execution' in v) {
                const taskStore = getModelStore('executionTask');
                const task = taskStore.get(r.taskId as string) as Record<string, unknown> | undefined;
                if (!task) return false;
                const execStore = getModelStore('projectExecution');
                const exec = execStore.get(task.executionId as string) as Record<string, unknown> | undefined;
                const targetProjId = (v as { execution?: { projectId?: string } }).execution?.projectId;
                return exec?.projectId === targetProjId || task.executionId === targetProjId;
              }
              if (v && typeof v === 'object' && 'in' in v) {
                return (v as { in: unknown[] }).in.includes(r[k]);
              }
              return r[k] === v;
            }),
          );
        }
        if (include?.execution) {
          const execStore = getModelStore('projectExecution');
          records = records.map((r) => {
            const exec = execStore.get(r.executionId as string) || { id: r.executionId, projectId: 'mock-proj' };
            return { ...r, execution: exec };
          });
        }
        if (include?.task) {
          const taskStore = getModelStore('executionTask');
          records = records.map((r) => {
            const task = taskStore.get(r.taskId as string) || { id: r.taskId };
            return { ...r, task };
          });
        }
        if (orderBy && typeof orderBy === 'object') {
          const [field, direction] = Object.entries(orderBy)[0] || [];
          if (field) {
            records.sort((a: any, b: any) => {
              const valA = a[field];
              const valB = b[field];
              if (valA instanceof Date && valB instanceof Date) {
                return direction === 'desc' ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime();
              }
              if (valA < valB) return direction === 'desc' ? 1 : -1;
              if (valA > valB) return direction === 'desc' ? -1 : 1;
              return 0;
            });
          }
        }
        if (take) records = records.slice(0, take);
        return Promise.resolve(records);
      });
    }
    if (prop === 'create') {
      let mockTimeOffset = 0;
      return vi.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        const id = (data.id as string) || generateId();
        mockTimeOffset += 10;
        const record = { ...data, id, createdAt: new Date(Date.now() + mockTimeOffset), updatedAt: new Date(Date.now() + mockTimeOffset) };
        s.set(id, record);
        return Promise.resolve(record);
      });
    }
    if (prop === 'createMany') {
      return vi.fn().mockImplementation(({ data }: { data: Array<Record<string, unknown>> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let count = 0;
        for (const item of data) {
          const id = (item.id as string) || generateId();
          const record = { ...item, id, createdAt: new Date(), updatedAt: new Date() };
          s.set(id, record);
          count++;
        }
        return Promise.resolve({ count });
      });
    }
    if (prop === 'update') {
      return vi.fn().mockImplementation(({ where, data, include }: { where: Record<string, unknown>; data: Record<string, unknown>; include?: Record<string, boolean> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let existingKey = where?.id as string | undefined;
        let existing = existingKey ? s.get(existingKey) : null;
        if (!existing && where) {
          for (const [k, v] of Array.from(s.entries())) {
            if (Object.entries(where).every(([wk, wv]) => (v as any)[wk] === wv)) {
              existingKey = k;
              existing = v;
              break;
            }
          }
        }
        const recordKey = existingKey || (where?.id as string) || (data?.id as string) || (where?.projectId as string) || generateId();
        let updated = { ...(existing ?? {}), ...data, id: recordKey };
        s.set(recordKey, updated);
        if (include?.execution && updated.executionId) {
          const execStore = getModelStore('projectExecution');
          updated = { ...updated, execution: execStore.get(updated.executionId as string) || { id: updated.executionId, projectId: 'mock-proj' } };
        }
        return Promise.resolve(updated);
      });
    }
    if (prop === 'updateMany') {
      return vi.fn().mockImplementation(({ where, data }: { where?: Record<string, unknown>; data: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let count = 0;
        if (!where || Object.keys(where).length === 0) {
          for (const [id, r] of Array.from(s.entries())) {
            s.set(id, { ...r, ...data });
            count++;
          }
        } else {
          for (const [id, r] of Array.from(s.entries())) {
            const matches = Object.entries(where).every(([k, v]) => {
              if (k === 'id' && v) return r.id === v;
              if (k === 'executionId' && v) return r.executionId === v;
              if (k === 'execution' && v && typeof v === 'object' && 'projectId' in v) {
                const execStore = getModelStore('projectExecution');
                const exec = execStore.get(r.executionId as string) as Record<string, unknown> | undefined;
                return exec?.projectId === (v as { projectId: string }).projectId;
              }
              return r[k] === v;
            });
            if (matches) {
              s.set(id, { ...r, ...data });
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      });
    }
    if (prop === 'upsert') {
      return vi.fn().mockImplementation(({ where, create, update }: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let existing = where?.id ? s.get(where.id as string) : null;
        if (!existing && where) {
          existing = Array.from(s.values()).find((r) =>
            Object.entries(where).every(([k, v]) => r[k] === v),
          );
        }
        if (existing) {
          const updated = { ...existing, ...update, updatedAt: new Date() };
          s.set((existing.id as string) || generateId(), updated);
          return Promise.resolve(updated);
        }
        const id = (create.id as string) || (where?.id as string) || generateId();
        const record = { ...create, id, createdAt: new Date(), updatedAt: new Date() };
        s.set(id, record);
        return Promise.resolve(record);
      });
    }
    if (prop === 'delete') {
      return vi.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
        const id = where?.id as string;
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        if (id) s.delete(id);
        return Promise.resolve({ id });
      });
    }
    if (prop === 'deleteMany') {
      return vi.fn().mockImplementation(({ where }: { where?: Record<string, unknown> }) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        let count = 0;
        if (!where || Object.keys(where).length === 0) {
          count = s.size;
          s.clear();
        } else {
          for (const [id, r] of Array.from(s.entries())) {
            const matches = Object.entries(where).every(([k, v]) => {
              if (k === 'execution' && v && typeof v === 'object' && 'projectId' in v) {
                const execStore = getModelStore('projectExecution');
                const exec = execStore.get(r.executionId as string) as Record<string, unknown> | undefined;
                return exec?.projectId === (v as { projectId: string }).projectId;
              }
              return r[k] === v;
            });
            if (matches) {
              s.delete(id);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      });
    }
    if (prop === 'count') {
      return vi.fn().mockImplementation(({ where }: { where?: Record<string, unknown> } = {}) => {
        const model = _target as unknown as { __modelName: string };
        const tableName = (model as unknown as Record<string, string>).__modelName;
        const s = getModelStore(tableName);
        if (!where || Object.keys(where).length === 0) return Promise.resolve(s.size);
        const matches = Array.from(s.values()).filter((r) =>
          Object.entries(where).every(([k, v]) => {
            if (k === 'execution' && v && typeof v === 'object' && 'projectId' in v) {
              const execStore = getModelStore('projectExecution');
              const exec = execStore.get(r.executionId as string) as Record<string, unknown> | undefined;
              return exec?.projectId === (v as { projectId: string }).projectId;
            }
            return r[k] === v;
          }),
        );
        return Promise.resolve(matches.length);
      });
    }
    if (prop === 'findFirst') {
      return vi.fn().mockResolvedValue(null);
    }
    return vi.fn().mockResolvedValue(null);
  },
};

// Proxy that returns model proxies for any property access
const prismaProxy = new Proxy({} as Record<string, unknown>, {
  get(_target, prop: string) {
    if (prop === '$executeRawUnsafe' || prop === '$executeRaw') {
      return vi.fn().mockResolvedValue(1);
    }
    if (prop === '$queryRawUnsafe' || prop === '$queryRaw') {
      return vi.fn().mockResolvedValue([]);
    }
    if (prop === '$transaction') {
      return vi.fn().mockImplementation((cbOrPromises: unknown) => {
        if (typeof cbOrPromises === 'function') return cbOrPromises(prismaProxy);
        if (Array.isArray(cbOrPromises)) return Promise.all(cbOrPromises);
        return Promise.resolve();
      });
    }
    if (prop.startsWith('$')) {
      return vi.fn().mockResolvedValue([]);
    }
    const modelProxy = new Proxy({ __modelName: prop }, modelHandler);
    return modelProxy;
  },
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaProxy,
}));

vi.mock('@/ai/agents/core/ai-call-stream', () => ({
  aiCallStreaming: vi.fn().mockRejectedValue(new Error('AI stream disabled in unit tests')),
}));
