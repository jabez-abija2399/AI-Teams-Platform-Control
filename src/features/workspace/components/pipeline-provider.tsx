"use client";

import { useMemo } from "react";
import { PipelineContext, usePipeline, type PipelineState } from "../hooks/use-pipeline";

export { usePipelineContext } from "../hooks/use-pipeline";

const defaultState: PipelineState = {
  currentPhase: "discovery",
  phaseStatus: "waiting",
  progress: 0,
  healthScore: 95,
  timeElapsed: "0m",
  phases: [],
  employees: [],
  activities: [],
  artifacts: [],
  approvalRequests: [],
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
      approve: pipeline.approve,
      refresh: pipeline.refresh,
    }),
    [pipeline.state, pipeline.loading, pipeline.error, pipeline.approve, pipeline.refresh],
  );

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}
