// This component relies on framer-motion SVG animations, which require browser APIs.
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
// Import our bespoke UI components.
import { GlassCard, StatusBadge } from '@/packages/ui';
// Import our custom data hook.
import { usePipelineState } from '../hooks/use-pipeline-state';

// Define properties.
interface PipelineVisualizerProps {
  projectId: string;
}

// A constant array defining the exact linear flow of our pipeline.
const PIPELINE_NODES = [
  { id: 'PRODUCT_MANAGER', label: 'Planning', description: 'Defining specs' },
  { id: 'ARCHITECT', label: 'Architecture', description: 'System design' },
  { id: 'UI_DESIGNER', label: 'UI Design', description: 'Component mapping' },
  { id: 'DEVELOPER', label: 'Execution', description: 'Writing code' },
] as const;

export function PipelineVisualizer({ projectId }: PipelineVisualizerProps) {
  // Pull real-time data from the backend hook.
  const { workflow, isLoading } = usePipelineState(projectId);

  // Helper to determine the status of a specific node in the pipeline.
  const getNodeStatus = (nodeId: string) => {
    if (!workflow || isLoading) return 'PENDING';
    const step = workflow.steps.find(s => s.agentRole === nodeId);
    return step ? step.status : 'PENDING';
  };

  // Calculate the overall progress percentage for the progress bar.
  const progressPercent = workflow ? workflow.percentComplete : 0;

  return (
    <GlassCard className="w-full flex flex-col p-8">
      {/* Header section showing the overall pipeline status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            Pipeline Execution
          </h2>
          <p className="text-sm text-white/50">
            Real-time visualization of the AI Team's workflow.
          </p>
        </div>
        
        {/* Render a StatusBadge showing the overarching health of the workflow. */}
        <StatusBadge 
          status={workflow?.status || 'IDLE'} 
          className="scale-110 origin-right" // Slightly larger for emphasis.
        />
      </div>

      {/* The core visualizer wrapper. Uses relative positioning to overlay nodes on top of the SVG paths. */}
      <div className="relative w-full py-8">
        
        {/* --- 1. Background SVG Path (The Track) --- */}
        {/* Absolute positioned to stretch across the container behind the nodes. */}
        <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2 h-1 bg-white/5 rounded-full overflow-hidden">
          
          {/* --- 2. Foreground SVG Path (The Progress) --- */}
          {(() => {
            const MotionDiv = motion.div as any;
            return (
              <MotionDiv 
                // The active progress bar fills up based on the percentComplete from the backend.
                className="h-full bg-gradient-to-r from-primary via-secondary to-success"
                // We use framer-motion to smoothly animate the width changes as data polls.
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
              />
            );
          })()}
        </div>

        {/* --- 3. The Nodes (The Agents) --- */}
        {/* Flexbox layout to evenly space the 4 nodes across the track. */}
        <div className="relative z-10 flex justify-between items-center w-full px-4">
          {PIPELINE_NODES.map((node, index) => {
            const status = getNodeStatus(node.id);
            const isCompleted = status === 'COMPLETED';
            const isActive = status === 'RUNNING';
            
            // Determine the border color based on status.
            let borderColor = 'border-white/10 bg-surface'; // Default (PENDING)
            if (isCompleted) borderColor = 'border-success bg-success/20 text-success';
            if (isActive) borderColor = 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(99,102,241,0.5)]';

            return (
              <div key={node.id} className="flex flex-col items-center group">
                
                {/* The Node Circle */}
                <div 
                  className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center 
                    transition-all duration-500 backdrop-blur-md relative
                    ${borderColor}
                  `}
                >
                  {/* If the node is completed, show a checkmark. Otherwise, show the step number. */}
                  {isCompleted ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                     </svg>
                  ) : (
                    <span className={`font-mono font-bold ${isActive ? 'text-primary' : 'text-white/30'}`}>
                      0{index + 1}
                    </span>
                  )}

                  {/* If active, attach the infinite pulsing ring behind the node. */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-primary"
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                </div>

                {/* The Node Label text positioned underneath the circle. */}
                <div className="mt-4 text-center absolute top-14 w-32 -ml-10">
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5 transition-colors ${isActive ? 'text-primary' : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
                    {node.label}
                  </h4>
                  <p className="text-[10px] text-white/30 font-mono hidden md:block">
                    {node.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
