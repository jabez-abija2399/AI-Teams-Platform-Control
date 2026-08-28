// This component requires 'use client' because it relies on framer-motion animations that run in the browser.
'use client';

// Import React for JSX parsing and type definitions.
import * as React from 'react';
// Import the motion component to allow us to animate the parent container.
import { motion } from 'framer-motion';
// Import our centralized custom UI components built in Milestone 2.
import { GlassCard, AgentAvatar, StatusBadge } from '@/packages/ui';
// Import our physics variants to cascade the cards into view beautifully.
import { staggerContainer, fadeUpVariant } from '@/packages/motion';
// Import our custom hook that streams the pipeline state in real-time.
import { usePipelineState } from '../hooks/use-pipeline-state';

// Define the properties required by the AgentRoster component.
interface AgentRosterProps {
  // The ID of the project we are monitoring, passed down from the page router.
  projectId: string;
}

// Define a hardcoded, absolute source of truth for the 4 modular agents in the pipeline.
const AGENTS_ROSTER = [
  { role: 'PRODUCT_MANAGER', name: 'Sarah', title: 'Product Manager' },
  { role: 'ARCHITECT', name: 'Marcus', title: 'System Architect' },
  { role: 'UI_DESIGNER', name: 'Elena', title: 'UI/UX Designer' },
  { role: 'DEVELOPER', name: 'Alex', title: 'Lead Developer' },
] as const;

// Export the AgentRoster component. This visually displays the AI team and their current statuses.
export function AgentRoster({ projectId }: AgentRosterProps) {
  // Consume our custom hook to get real-time workflow data.
  const { workflow, isLoading } = usePipelineState(projectId);

  // A helper function to determine a specific agent's status based on the overarching workflow state.
  const getAgentStatus = (role: string) => {
    // If the pipeline is still loading or doesn't exist, all agents are IDLE.
    if (!workflow || isLoading) return 'IDLE';
    
    // Find the specific step in the workflow array that belongs to this agent's role.
    const step = workflow.steps.find((s) => s.agentRole === role);
    
    // If no step maps to this agent (shouldn't happen), default to IDLE.
    if (!step) return 'IDLE';

    // If the step status is RUNNING but the overall pipeline is PAUSED or FAILED, reflect the pipeline health.
    if (step.status === 'RUNNING') {
      if (workflow.status === 'PAUSED') return 'PAUSED';
      if (workflow.status === 'FAILED') return 'FAILED';
    }
    
    // Otherwise, return the exact status of the agent's step (e.g., PENDING, RUNNING, COMPLETED).
    return step.status;
  };

  return (
    <motion.div
      // Attach the staggerContainer variant to orchestrate the entrance of children.
      variants={staggerContainer}
      // Start in the hidden state.
      initial="hidden"
      // Automatically animate to the 'show' state when mounted, triggering the cascade.
      animate="show"
      // Use CSS Grid to display the 4 agents responsively.
      // 1 column on mobile, 2 columns on medium screens, 4 columns on large screens.
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Map over our constant array of agents to render a card for each. */}
      {AGENTS_ROSTER.map((agent) => {
        // Calculate the real-time status of this specific agent.
        const status = getAgentStatus(agent.role);
        // Determine if the agent is actively working (used to trigger pulsing avatars).
        const isActive = status === 'RUNNING';

        return (
          <motion.div
            // Provide a unique React key based on the role.
            key={agent.role}
            // Attach the fadeUpVariant so this specific card responds to the parent's stagger command.
            variants={fadeUpVariant}
          >
            {/* Wrap the content in our premium interactive GlassCard. */}
            <GlassCard interactive={true} className="flex flex-col items-center p-6 text-center">
              
              {/* Render our bespoke AgentAvatar, passing the active state and role. */}
              <AgentAvatar 
                role={agent.role} 
                isActive={isActive} 
                size="lg" 
                className="mb-4"
              />
              
              {/* Render the agent's human-readable name. */}
              <h3 className="text-sm font-bold text-white mb-1 tracking-tight">
                {agent.name}
              </h3>
              
              {/* Render the agent's technical title. */}
              <p className="text-xs text-white/50 uppercase tracking-widest font-mono mb-4">
                {agent.title}
              </p>
              
              {/* Render the pulsing status pill to indicate exactly what this agent is doing. */}
              <StatusBadge status={status as any} />
              
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
