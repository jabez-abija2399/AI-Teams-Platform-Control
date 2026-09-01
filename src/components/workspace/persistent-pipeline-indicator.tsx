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
    <div className="flex items-center gap-1 bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-1 text-xs font-mono">
      {stages.map((st, idx) => {
        const isCurrent = st.stage === currentStage || st.status === 'IN_PROGRESS';
        const isCompleted = st.status === 'COMPLETED';
        const isReview = st.status === 'REVIEW_REQUIRED';

        return (
          <React.Fragment key={st.stage}>
            {idx > 0 && <span className="text-[#3c4949] font-bold px-0.5">→</span>}

            <button
              onClick={() => onSelectStage?.(st.stage)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-all text-[11px] ${
                isCurrent
                  ? 'bg-[#56d9d9] text-black font-bold border border-[#76f6f5]'
                  : isCompleted
                  ? 'bg-[#00acac]/10 text-[#56d9d9] border border-[#00acac]/40 hover:bg-[#00acac]/20'
                  : isReview
                  ? 'bg-[#e1824e]/10 text-[#e1824e] border border-[#e1824e]/40 hover:bg-[#e1824e]/20'
                  : 'bg-[#131313] text-[#869393] hover:text-[#e2e2e2] border border-[#353535]'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-[#56d9d9] stroke-[3]" />
              ) : isCurrent ? (
                <Play className="w-3 h-3 text-black fill-black" />
              ) : isReview ? (
                <AlertCircle className="w-3.5 h-3.5 text-[#e1824e]" />
              ) : (
                <Circle className="w-3 h-3 text-[#869393]" />
              )}

              <span>{st.stage}</span>

              {st.version && st.version > 1 && (
                <span className="text-[9px] bg-[#353535] text-[#bbc9c8] px-1 rounded-xs">
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
