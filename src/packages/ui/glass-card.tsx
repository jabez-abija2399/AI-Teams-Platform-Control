'use client'; // This directive tells Next.js that this component runs in the browser, required because we use framer-motion which relies on browser APIs.

// Import React to type our component properties.
import * as React from 'react';
// Import the motion component from framer-motion to enable advanced physics-based animations.
import { motion } from 'framer-motion';
// Import our centralized animation variants from the motion package to ensure physical consistency.
import { interactiveGlassVariant, fadeUpVariant } from '@/packages/motion';

// Define the properties our GlassCard will accept.
interface GlassCardProps {
  // The React children that will be rendered inside the card (e.g., text, other components).
  children: React.ReactNode;
  // An optional string to allow consumers to add additional Tailwind classes (like margins or widths).
  className?: string;
  // A boolean to determine if the card should be interactive (hover/tap physics). Defaults to false.
  interactive?: boolean;
  // An optional delay in seconds for the entrance animation (useful for staggered lists).
  delay?: number;
}

// Export the GlassCard component. This is the foundational container for our entire UI.
export function GlassCard({ children, className = '', interactive = false, delay = 0 }: GlassCardProps) {
  // Cast motion.div to any to bypass React 19 type conflicts with Framer Motion.
  const MotionDiv = motion.div as any;

  // We use MotionDiv as our wrapper to allow framer-motion to control the element.
  return (
    <MotionDiv
      // If the card is interactive, we apply the hover and tap states from our physics engine.
      // If it's not interactive, we apply standard fade-up entrance animations.
      variants={interactive ? interactiveGlassVariant : fadeUpVariant}
      // Set the initial state of the animation to "rest" (if interactive) or "hidden" (if static).
      initial={interactive ? "rest" : "hidden"}
      // Animate to the "rest" state (if interactive) or "show" (if static) when the component mounts.
      animate={interactive ? "rest" : "show"}
      // If interactive, apply the hover animation state when the mouse enters the card.
      whileHover={interactive ? "hover" : undefined}
      // If interactive, apply the tap animation state when the card is clicked.
      whileTap={interactive ? "tap" : undefined}
      // Override the transition delay if a custom delay was passed (for staggered entrances).
      transition={!interactive ? { delay } : undefined}
      // Apply the core Tailwind classes for the Glassmorphism aesthetic.
      // 1. relative overflow-hidden: Contains children and potential glow effects.
      // 2. bg-surface-glass/40: Uses our custom HSL variable with 40% opacity for translucency.
      // 3. backdrop-blur-xl: Blurs whatever is physically behind the card for the frosted glass look.
      // 4. border border-white/10: A very subtle, semi-transparent white border to give the card an edge.
      // 5. rounded-2xl: A smooth, modern border radius.
      // 6. p-6: Standardized internal padding.
      // 7. Append any custom classes passed via the className prop.
      className={`relative overflow-hidden bg-surface-glass/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}
    >
      {/* Render the actual content passed into the card */}
      {children}
    </MotionDiv>
  );
}
