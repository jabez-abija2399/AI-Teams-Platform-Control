export type PipelineStepId = 'ceo' | 'ceo_review' | 'product_manager' | 'pm_review' | 'architect' | 'architect_review' | 'developer' | 'qa' | 'security' | 'deploy';

export type StepStatus = 'waiting' | 'running' | 'complete' | 'failed';

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  status: StepStatus;
  message: string;
  startedAt?: number;
  completedAt?: number;
}

export interface PipelineState {
  steps: PipelineStep[];
  currentStep: PipelineStepId | null;
  running: boolean;
}
