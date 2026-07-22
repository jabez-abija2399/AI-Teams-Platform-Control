import { prisma } from '@/lib/prisma';
import { developmentPlannerTool, codeGeneratorTool } from './developer.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { developerOutputSchema, type DeveloperOutput, type BuildEvent, type BuildState, type TaskInfo, type TaskStatus, type CodeChange } from './developer.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ApiResult } from '@/types/common.types';
import { syncFilesToWorkspace } from '@/features/workspace/explorer/services/workspace-sync.service';
import { EventEmitter } from 'events';

const MAX_RETRIES_PER_TASK = 3;

function getLanguageFromPath(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
    yaml: 'yaml', yml: 'yaml', sql: 'sql', sh: 'shell', bash: 'shell',
  };
  return map[ext ?? ''] ?? null;
}

async function getOrCreateDeveloperAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DEVELOPER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Developer AI', role: 'DEVELOPER', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

// ── In-memory build state ──────────────────────────────────────────
const builds = new Map<string, BuildState>();
const buildEmitters = new Map<string, EventEmitter>();

function getBuildEmitter(projectId: string): EventEmitter {
  let emitter = buildEmitters.get(projectId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    buildEmitters.set(projectId, emitter);
  }
  return emitter;
}

function emitBuildEvent(projectId: string, event: BuildEvent): void {
  const state = builds.get(projectId);
  if (state) state.progress = event;
  const emitter = getBuildEmitter(projectId);
  emitter.emit('progress', event);
}

function cleanupBuildState(projectId: string): void {
  builds.delete(projectId);
  const emitter = buildEmitters.get(projectId);
  if (emitter) {
    emitter.removeAllListeners();
    buildEmitters.delete(projectId);
  }
}

export function getBuildState(projectId: string): BuildState | undefined {
  return builds.get(projectId);
}

export function subscribeToBuild(projectId: string, listener: (event: BuildEvent) => void): () => void {
  const emitter = getBuildEmitter(projectId);
  emitter.on('progress', listener);
  return () => { emitter.off('progress', listener); };
}

export function cancelBuild(projectId: string): boolean {
  const state = builds.get(projectId);
  if (!state) return false;
  state.controller.abort();
  emitBuildEvent(projectId, {
    type: 'cancelled',
    phase: 'complete',
    message: 'Build cancelled by user',
    completedTasks: state.progress.completedTasks,
    totalTasks: state.progress.totalTasks,
  });
  return true;
}

// ── DAG execution ──────────────────────────────────────────────────
function buildTaskLayers(tasks: string[], dependencies: string[]): string[][] {
  const depMap = new Map<string, string[]>();
  for (const t of tasks) depMap.set(t, []);
  for (const dep of dependencies) {
    const [from, to] = dep.split('->').map((s) => s.trim());
    if (from && to && depMap.has(from)) {
      depMap.get(from)!.push(to);
    }
  }

  const layers: string[][] = [];
  const done = new Set<string>();

  while (done.size < tasks.length) {
    const batch = tasks.filter((t) => {
      if (done.has(t)) return false;
      return (depMap.get(t) ?? []).every((d) => done.has(d));
    });
    if (batch.length === 0) {
      layers.push(tasks.filter((t) => !done.has(t)));
      break;
    }
    layers.push(batch);
    for (const t of batch) done.add(t);
  }
  return layers;
}

async function executeWithRetry(
  fn: () => Promise<CodeChange[]>,
  taskDesc: string,
  signal?: AbortSignal,
  attempt = 0,
): Promise<CodeChange[]> {
  try {
    if (signal?.aborted) return [];
    return await fn();
  } catch (err) {
    if (signal?.aborted) return [];
    if (attempt < MAX_RETRIES_PER_TASK) {
      const delayMs = 1000 * Math.pow(2, attempt);
      await new Promise((r) => {
        const timer = setTimeout(r, delayMs);
        const onAbort = () => { clearTimeout(timer); r(undefined); };
        signal?.addEventListener('abort', onAbort, { once: true });
      });
      if (signal?.aborted) return [];
      return executeWithRetry(fn, taskDesc, signal, attempt + 1);
    }
    throw err;
  }
}

// ── Main implementation ────────────────────────────────────────────
export async function implementArchitecture(
  projectId: string,
  architecture: ArchitectAnalysis,
): Promise<ApiResult<DeveloperOutput>> {
  const controller = new AbortController();
  const signal = controller.signal;

  if (builds.has(projectId)) {
    cancelBuild(projectId);
  }

  const buildState: BuildState = {
    controller,
    progress: {
      type: 'planning:analyzing',
      phase: 'planning',
      message: 'Analyzing architecture...',
      completedTasks: 0,
      totalTasks: 0,
    },
    tasks: [],
    generatedFiles: [],
    startedAt: Date.now(),
  };
  builds.set(projectId, buildState);

  const agentId = await getOrCreateDeveloperAgentId();
  const memory = getMemoryManager();

  await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });
  await prisma.document.create({
    data: {
      projectId, type: 'DEVELOPMENT_IN_PROGRESS',
      title: 'Development In Progress',
      content: JSON.stringify({ phase: 'planning', completedTasks: 0, totalTasks: 0, generatedFiles: [] }),
      author: 'Developer AI',
    },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DEVELOPER_IMPLEMENTATION_STARTED', { projectId }, agentId);

  try {
    // ── Phase: Planning (progressive steps) ──
    emitBuildEvent(projectId, {
      type: 'planning:analyzing',
      phase: 'planning',
      message: 'Analyzing architecture document...',
      completedTasks: 0, totalTasks: 0,
    });

    if (signal.aborted) throw new Error('BUILD_CANCELLED');
    await new Promise((r) => setTimeout(r, 50));

    emitBuildEvent(projectId, {
      type: 'planning:identifying',
      phase: 'planning',
      message: 'Identifying implementation tasks...',
      completedTasks: 0, totalTasks: 0,
    });

    const planResult = await developmentPlannerTool.execute({ architecture, projectId, agentId, signal });
    if (!planResult.success) throw new Error(planResult.error);

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    const plan = planResult.data;
    const tasks: TaskInfo[] = plan.tasks.map((t) => ({ description: t, status: 'pending' as TaskStatus }));
    buildState.tasks = tasks;

    emitBuildEvent(projectId, {
      type: 'planning:ordering',
      phase: 'planning',
      message: `Ordering ${plan.tasks.length} tasks by dependencies...`,
      completedTasks: 0, totalTasks: plan.tasks.length,
      tasks,
    });

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    const layers = buildTaskLayers(plan.tasks, plan.dependencies);

    emitBuildEvent(projectId, {
      type: 'planning:complete',
      phase: 'generating', // transition to generating
      message: `Plan ready: ${plan.tasks.length} tasks in ${layers.length} parallel batch(es)`,
      completedTasks: 0, totalTasks: plan.tasks.length,
      tasks,
    });

    // Write plan to DB at milestone
    await prisma.document.updateMany({
      where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' },
      data: {
        content: JSON.stringify({
          phase: 'generating', plan,
          completedTasks: 0, totalTasks: plan.tasks.length,
          generatedFiles: [],
        }),
      },
    });

    // ── Phase: Generating (DAG parallel execution) ──
    const allChanges: CodeChange[] = [];
    const generatedFiles: string[] = [];
    let completedCount = 0;

    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
      if (signal.aborted) throw new Error('BUILD_CANCELLED');

      const batch = layers[layerIdx]!;

      emitBuildEvent(projectId, {
        type: 'batch:starting',
        phase: 'generating',
        message: `Executing batch ${layerIdx + 1}/${layers.length} (${batch.length} task(s))`,
        completedTasks: completedCount,
        totalTasks: plan.tasks.length,
        currentTask: batch[0],
        tasks: buildState.tasks,
        generatedFiles: [...generatedFiles],
      });

      const results = await Promise.all(
        batch.map(async (taskDesc) => {
          if (signal.aborted) return null;

          const taskInfo = tasks.find((t) => t.description === taskDesc);
          if (taskInfo) taskInfo.status = 'running';

          emitBuildEvent(projectId, {
            type: 'task:starting',
            phase: 'generating',
            message: `Generating: ${taskDesc}`,
            completedTasks: completedCount,
            totalTasks: plan.tasks.length,
            currentTask: taskDesc,
            tasks: buildState.tasks,
            generatedFiles: [...generatedFiles],
          });

          try {
            const changes = await executeWithRetry(
              () => codeGeneratorTool.execute({ architecture, task: taskDesc, projectId, agentId, signal })
                .then((r) => {
                  if (!r.success) throw new Error(r.error);
                  return r.data!;
                }),
              taskDesc,
              signal,
            );

            if (taskInfo) taskInfo.status = 'done';
            completedCount++;

            for (const c of changes) {
              if (!generatedFiles.includes(c.file)) generatedFiles.push(c.file);
            }

            emitBuildEvent(projectId, {
              type: 'task:complete',
              phase: 'generating',
              message: `Completed: ${taskDesc}`,
              completedTasks: completedCount,
              totalTasks: plan.tasks.length,
              currentTask: taskDesc,
              tasks: buildState.tasks,
              generatedFiles: [...generatedFiles],
              eta: estimateEta(buildState, completedCount),
            });

            return changes;
          } catch (err) {
            if (signal.aborted) return null;
            if (taskInfo) taskInfo.status = 'failed';
            completedCount++;

            emitBuildEvent(projectId, {
              type: 'task:failed',
              phase: 'generating',
              message: `Failed: ${taskDesc} — ${err instanceof Error ? err.message : 'Unknown error'}`,
              completedTasks: completedCount,
              totalTasks: plan.tasks.length,
              currentTask: taskDesc,
              tasks: buildState.tasks,
              generatedFiles: [...generatedFiles],
              error: err instanceof Error ? err.message : 'Unknown error',
            });

            return null;
          }
        }),
      );

      buildState.generatedFiles = generatedFiles;

      for (const result of results) {
        if (result) allChanges.push(...result);
      }
    }

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    // ── Phase: Saving ──
    emitBuildEvent(projectId, {
      type: 'saving',
      phase: 'saving',
      message: 'Saving results...',
      completedTasks: completedCount,
      totalTasks: plan.tasks.length,
      generatedFiles: [...generatedFiles],
    });

    const output = developerOutputSchema.parse({
      plan,
      changes: allChanges,
      report: {
        completed: allChanges.length > 0,
        changedFiles: [...new Set(allChanges.map((c) => c.file))],
        issues: allChanges.length < plan.tasks.length
          ? [`${plan.tasks.length - allChanges.length} task(s) failed to generate code`]
          : [],
        notes: `Implemented ${allChanges.length} file change(s) across ${plan.tasks.length} task(s) in ${layers.length} batch(es).`,
      },
    });

    const failedCount = tasks.filter((t) => t.status === 'failed').length;
    const summary = failedCount > 0
      ? `Implemented ${allChanges.length} file(s) across ${plan.tasks.length} task(s) (${failedCount} failed)`
      : `Project ${projectId}: implemented ${output.report.changedFiles.length} files`;

    await Promise.all([
      prisma.developmentTask.create({
        data: {
          projectId, agentId, plan: plan as never, status: 'COMPLETED',
          codeChanges: {
            create: allChanges.map((c) => ({
              file: c.file, changeType: c.changeType,
              description: c.description, code: c.code,
            })),
          },
        },
      }),
      prisma.document.create({
        data: {
          projectId, type: 'DEVELOPMENT_SUMMARY',
          title: 'Development Summary',
          content: JSON.stringify(output.report),
          author: 'Developer AI',
        },
      }),
      memory.remember({
        agentId, content: summary,
        type: 'PROJECT', metadata: { projectId },
      }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });

    // Sync to workspace (fire and forget)
    const filesForWorkspace = allChanges
      .filter((c) => c.changeType === 'CREATE' || c.changeType === 'MODIFY')
      .map((c) => ({
        path: c.file,
        content: c.code,
        language: getLanguageFromPath(c.file),
      }));

    syncFilesToWorkspace(projectId, filesForWorkspace).catch((err) =>
      console.error('[Developer] Workspace sync failed:', err),
    );

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DEVELOPER_IMPLEMENTATION_COMPLETED', { projectId }, agentId);

    emitBuildEvent(projectId, {
      type: 'complete',
      phase: 'complete',
      message: `Implementation complete — ${allChanges.length} file(s) changed`,
      completedTasks: completedCount,
      totalTasks: plan.tasks.length,
      generatedFiles: [...generatedFiles],
    });

    cleanupBuildState(projectId);
    return { success: true, data: output };
  } catch (err) {
    const isCancelled = err instanceof Error && err.message === 'BUILD_CANCELLED';
    const errMsg = isCancelled
      ? 'Build cancelled'
      : err instanceof Error ? err.message : 'Implementation failed';

    if (!isCancelled) {
      await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('DEVELOPER_IMPLEMENTATION_FAILED', { projectId, error: errMsg }, agentId);
    }

    emitBuildEvent(projectId, {
      type: isCancelled ? 'cancelled' : 'error',
      phase: 'complete',
      message: errMsg,
      completedTasks: buildState.progress.completedTasks,
      totalTasks: buildState.progress.totalTasks,
      error: errMsg,
    });

    cleanupBuildState(projectId);

    if (isCancelled) {
      return { success: false, error: { message: errMsg, code: 'BUILD_CANCELLED' } };
    }
    return { success: false, error: { message: errMsg, code: 'AI_ERROR' } };
  }
}

function estimateEta(state: BuildState, completed: number): number {
  const elapsed = Date.now() - state.startedAt;
  if (completed === 0 || elapsed < 1000) return 0;
  const avgPerTask = elapsed / completed;
  const remaining = state.progress.totalTasks - completed;
  return Math.round(avgPerTask * remaining);
}
