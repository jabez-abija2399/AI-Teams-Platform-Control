import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PipelineManager } from '../../src/core/integration/pipeline-manager';
import { ExecutionStateService } from '../../src/core/integration/execution-state.service';
import { PipelineEngine } from '../../src/core/workflow-engine/pipeline-engine';

const mockRun = vi.fn().mockResolvedValue({ status: 'completed', pipelineSuccess: true });
vi.mock('../../src/core/workflow-engine/pipeline-engine', () => {
  return {
    PipelineEngine: vi.fn().mockImplementation(function(this: any) {
      this.run = mockRun;
      return this;
    })
  };
});

describe('PipelineManager', () => {
  const testProjectId = 'proj_pipe_test_101';

  beforeEach(() => {
    ExecutionStateService.resetAll();
    vi.clearAllMocks();
  });

  it('1. should start a project successfully and initialize PipelineEngine', async () => {
    ExecutionStateService.initState(testProjectId, 'CREATED');
    const res = await PipelineManager.startProject(testProjectId, 'Build an AI tool');
    
    if (!res.success) {
      console.log('Error in startProject:', res.error);
    }

    expect(res.success).toBe(true);
    expect(PipelineEngine).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({
      projectId: testProjectId,
      userIdea: 'Build an AI tool'
    }));
  });

  it('2. should pause a project', async () => {
    ExecutionStateService.initState(testProjectId, 'EXECUTION');
    const res = await PipelineManager.pauseProject(testProjectId, 'Needs review');
    
    expect(res.success).toBe(true);
    const state = ExecutionStateService.getState(testProjectId);
    expect(state.currentPhase).toBe('PAUSED');
    expect(state.executionHealth).toBe('PAUSED');
  });

  it('3. should resume a project', async () => {
    ExecutionStateService.initState(testProjectId, 'PAUSED');
    vi.spyOn(ExecutionStateService, 'getState').mockReturnValue({
      projectId: testProjectId,
      currentPhase: 'PAUSED',
      previousPhase: 'ARCHITECTURE',
      executionHealth: 'PAUSED',
      completedTasks: [],
      errorCount: 0
    } as any);

    const res = await PipelineManager.resumeProject(testProjectId, { requirements: [] });
    
    expect(res.success).toBe(true);
    expect(PipelineEngine).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalled();
  });

  it('4. should retry a project', async () => {
    vi.spyOn(ExecutionStateService, 'getState').mockReturnValue({
      projectId: testProjectId,
      currentPhase: 'FAILED',
      previousPhase: 'PLANNING',
      executionHealth: 'FAILED',
      completedTasks: [],
      errorCount: 1
    } as any);

    const res = await PipelineManager.retryProject(testProjectId, { prd: {} });
    if (!res.success) {
      console.log('Error in retryProject:', res.error);
    }
    
    expect(res.success).toBe(true);
    expect(PipelineEngine).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalled();
  });
});
