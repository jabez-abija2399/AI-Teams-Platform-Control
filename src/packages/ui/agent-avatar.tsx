// Import React to type our component properties.
import * as React from 'react';
// Import the motion component from framer-motion to create pulsing animation effects.
import { motion } from 'framer-motion';
// Import the Lucide icons corresponding to our 4 new Agent roles.
import { Rocket, Layers, Palette, Code2 } from 'lucide-react';

// Define the properties our AgentAvatar will accept.
interface AgentAvatarProps {
  // We strictly limit the roles to our new 4-agent modular architecture.
  role: 'PRODUCT_MANAGER' | 'ARCHITECT' | 'UI_DESIGNER' | 'DEVELOPER';
  // A boolean to indicate if this specific agent is currently executing a task in the pipeline.
  isActive?: boolean;
  // An optional size parameter to scale the avatar perfectly.
  size?: 'sm' | 'md' | 'lg';
  // An optional string for appending generic Tailwind classes.
  className?: string;
}

// Export the AgentAvatar component. This gives a premium, visual identity to the AI workers.
export function AgentAvatar({ role, isActive = false, size = 'md', className = '' }: AgentAvatarProps) {
  
  // A helper function to return the precise Icon and styling ring color for the agent.
  const getAgentConfig = () => {
    switch (role) {
      case 'PRODUCT_MANAGER':
        // PM uses the Rocket icon and a teal/cyan styling.
        return { Icon: Rocket, colorClass: 'text-cyan-400 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-950/30' };
      case 'ARCHITECT':
        // Architect uses Layers and our primary Electric Indigo styling.
        return { Icon: Layers, colorClass: 'text-primary border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] bg-indigo-950/30' };
      case 'UI_DESIGNER':
        // UI Designer uses Palette and a hot pink/purple styling for contrast.
        return { Icon: Palette, colorClass: 'text-fuchsia-400 border-fuchsia-400/50 shadow-[0_0_15px_rgba(232,121,249,0.3)] bg-fuchsia-950/30' };
      case 'DEVELOPER':
        // Developer uses Code2 and the Emerald Matrix success styling.
        return { Icon: Code2, colorClass: 'text-success border-success/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-950/30' };
    }
  };

  // Extract the specific configuration for the passed role.
  const { Icon, colorClass } = getAgentConfig();

  // A helper to map the semantic size string to exact Tailwind height/width dimensions.
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'md': return 'h-12 w-12';
      case 'lg': return 'h-16 w-16';
    }
  };

  // A helper to scale the inner icon based on the container size.
  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-5 w-5';
      case 'lg': return 'h-7 w-7';
    }
  };

  return (
    <div 
      // The wrapper uses relative positioning to contain absolute-positioned glow effects.
      // We apply standard flex-centering, a full border-radius, and our translucent glass effects.
      className={`relative inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${getSizeClasses()} ${isActive ? colorClass : 'border-white/10 text-white/50 bg-white/5 grayscale'} ${className}`}
    >
      {/* If the agent is currently working (isActive), render an infinite pulsating ring behind the icon. */}
      {isActive && (() => {
        const MotionDiv = motion.div as any;
        return (
          <MotionDiv
            // Animate from scale 1 (normal) to scale 1.4 (expanded) while fading to absolute zero opacity.
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            // Ensure this ring is positioned absolutely behind the icon and inherits the border color.
            className="absolute inset-0 rounded-full border border-current"
          />
        );
      })()}
      
      {/* Render the actual Lucide icon centered in the circle. */}
      <Icon className={getIconSizeClasses()} strokeWidth={isActive ? 2.5 : 2} />
    </div>
  );
}
