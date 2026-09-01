'use client';

import React from 'react';
import { Check, Circle, AlertCircle, Play } from 'lucide-react';

export type PipelineStage = 'CEO' | 'ARCHITECT' | 'DESIGNER' | 'DEVELOPER';

export interface StageState {
  stage: PipelineStage;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED' | 'PENDING';
  version?: number;
}

interface PersistentPipelineIndicatorProps {
  stages?: StageState[];
  currentStage?: PipelineStage;
  onSelectStage?: (stage: PipelineStage) => void;
}

const DEFAULT_STAGES: StageState[] = [
  { stage: 'CEO', status: 'COMPLETED', version: 1 },
  { stage: 'ARCHITECT', status: 'COMPLETED', version: 1 },
  { stage: 'DESIGNER', status: 'IN_PROGRESS', version: 1 },
  { stage: 'DEVELOPER', status: 'PENDING' },
];

export function PersistentPipelineIndicator({
  stages = DEFAULT_STAGES,
  currentStage = 'DESIGNER',
  onSelectStage,
}: PersistentPipelineIndicatorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-900/90 border border-gray-800 rounded-lg p-1 text-xs font-mono">
      {stages.map((st, idx) => {
        const isCurrent = st.stage === currentStage || st.status === 'IN_PROGRESS';
        const isCompleted = st.status === 'COMPLETED';
        const isReview = st.status === 'REVIEW_REQUIRED';

        return (
          <React.Fragment key={st.stage}>
            {idx > 0 && <span className="text-gray-700 font-bold px-0.5">→</span>}

            <button
              onClick={() => onSelectStage?.(st.stage)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                isCurrent
                  ? 'bg-indigo-600/90 text-white font-bold shadow-sm ring-1 ring-indigo-400/30 animate-pulse'
                  : isCompleted
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/40'
                  : isReview
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40'
                  : 'bg-gray-950/50 text-gray-500 hover:text-gray-300'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              ) : isCurrent ? (
                <Play className="w-3 h-3 text-indigo-200 fill-indigo-200" />
              ) : isReview ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Circle className="w-3 h-3 text-gray-600" />
              )}

              <span>{st.stage}</span>

              {st.version && st.version > 1 && (
                <span className="text-[10px] bg-gray-800 text-gray-300 px-1 rounded">
                  v{st.version}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
