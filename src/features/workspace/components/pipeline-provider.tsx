'use client';

import { useMemo } from 'react';
import { PipelineContext, usePipeline, type PipelineState } from '../hooks/use-pipeline';

export { usePipelineContext } from '../hooks/use-pipeline';

const defaultState: PipelineState = {
  currentPhase: 'discovery',
  phaseStatus: 'waiting',
  progress: 0,
  healthScore: 95,
  timeElapsed: '0m',
  phases: [],
  employees: [],
  activities: [],
  artifacts: [],
  approvalRequests: [],
  pendingDocument: null,
  liveGeneration: null,
  usage: null,
  revisionDiff: null,
};

export function PipelineProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const pipeline = usePipeline(projectId);

  const value = useMemo(
    () => ({
      state: pipeline.state || defaultState,
      loading: pipeline.loading,
      error: pipeline.error,
      connectionStatus: pipeline.connectionStatus,
      approve: pipeline.approve,
      requestChanges: pipeline.requestChanges,
      retryGeneration: pipeline.retryGeneration,
      refresh: pipeline.refresh,
    }),
    [
      pipeline.state,
      pipeline.loading,
      pipeline.error,
      pipeline.connectionStatus,
      pipeline.approve,
      pipeline.requestChanges,
      pipeline.retryGeneration,
      pipeline.refresh,
    ],
  );

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}
