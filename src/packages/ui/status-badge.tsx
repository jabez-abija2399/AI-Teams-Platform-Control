// Import React to type our component properties.
import * as React from 'react';
// Import the motion component from framer-motion to create pulsing animation effects.
import { motion } from 'framer-motion';
// Import our centralized HSL theme colors so we can pass them into Framer Motion directly if needed.
import { colors } from '@/packages/theme';

// Define the properties our StatusBadge will accept.
interface StatusBadgeProps {
  // The current status text to display.
  status: 'RUNNING' | 'FAILED' | 'COMPLETED' | 'PAUSED' | 'IDLE' | 'HEALTHY' | 'DEGRADED';
  // An optional string to allow consumers to add additional Tailwind classes.
  className?: string;
}

// Export the StatusBadge component. It visually represents the health/state of an agent or pipeline.
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  
  // A helper function to determine the color of the dot and text based on the exact status.
  const getStatusColor = () => {
    switch (status) {
      case 'RUNNING':
        // Electric Indigo (Primary) for active work.
        return 'text-primary bg-primary/20 border-primary/30';
      case 'COMPLETED':
      case 'HEALTHY':
        // Emerald Matrix (Success) for finished or healthy work.
        return 'text-success bg-success/20 border-success/30';
      case 'FAILED':
        // Crimson Red (Danger) for errors.
        return 'text-danger bg-danger/20 border-danger/30';
      case 'PAUSED':
      case 'DEGRADED':
        // Solar Orange (Warning) for halted or degraded work.
        return 'text-warning bg-warning/20 border-warning/30';
      case 'IDLE':
      default:
        // Muted gray for inactive agents.
        return 'text-text-tertiary bg-white/5 border-white/10';
    }
  };

  // Determine if the badge should pulse. Only 'RUNNING' processes get the infinite pulse animation.
  const isPulsing = status === 'RUNNING';

  return (
    <div 
      // We build the pill shape using Tailwind.
      // 1. inline-flex items-center gap-2: Centers the dot and text in a row.
      // 2. rounded-full px-2.5 py-0.5: Classic pill shape.
      // 3. border text-[10px] font-bold uppercase tracking-wider: Small, legible, tech-style font.
      // 4. Inject the dynamically determined status colors.
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor()} ${className}`}
    >
      {/* This relative wrapper holds the colored dot and its optional pulsing ring. */}
      <div className="relative flex h-2 w-2 items-center justify-center">
        {/* If the status is RUNNING, render the absolute positioned pulsing ring behind the dot. */}
        {isPulsing && (() => {
          const MotionSpan = motion.span as any;
          return (
            <MotionSpan
              // Use Framer Motion to create an infinite ripple effect.
              animate={{
                // Scale up by 250% over the duration.
                scale: [1, 2.5],
                // Fade out to absolute transparency as it grows.
                opacity: [0.8, 0],
              }}
              transition={{
                // Loop forever.
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              // Style the ripple as an absolute circle that matches the text color (currentColor).
              className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75"
            />
          );
        })()}
        {/* Render the actual solid dot on top. */}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </div>
      
      {/* Render the status string next to the dot. */}
      <span>{status}</span>
    </div>
  );
}
