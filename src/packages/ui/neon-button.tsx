'use client'; // Required because framer-motion uses browser APIs.

// Import React to type our component properties.
import * as React from 'react';
// Import the motion component from framer-motion for physical interactions.
import { motion } from 'framer-motion';
// Import our bouncy spring for snappy button clicks.
import { bouncySpring } from '@/packages/motion';
// Import lucide-react to potentially render an icon (if passed).
import { Loader2 } from 'lucide-react';

// Define the properties our NeonButton will accept.
interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // The variant determines the color gradient (primary = indigo, secondary = cyan, danger = red).
  variant?: 'primary' | 'secondary' | 'danger';
  // A boolean to indicate if the button is currently processing an action.
  isLoading?: boolean;
  // An optional icon component to render next to the text.
  icon?: React.ReactNode;
}

// Export the NeonButton component. This is the primary call-to-action component for the app.
export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    // Destructure the properties, defaulting variant to 'primary' and isLoading to false.
    // The rest operator (...props) captures all standard HTML button attributes (like onClick, disabled).
    { className = '', variant = 'primary', isLoading = false, icon, children, disabled, ...props }, 
    ref // Receive the forwarded ref (useful if parent components need direct access to the DOM node).
  ) => {
    
    // A helper function to determine the Tailwind classes for the background gradient based on the variant.
    const getVariantClasses = () => {
      switch (variant) {
        // If primary, use a gradient from our custom Electric Indigo to a deep purple.
        case 'primary': return 'bg-gradient-to-r from-primary to-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.4)]';
        // If secondary, use a gradient from our Cyber Cyan to a deep blue.
        case 'secondary': return 'bg-gradient-to-r from-secondary to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
        // If danger, use a gradient from Crimson Red to a deep ruby.
        case 'danger': return 'bg-gradient-to-r from-danger to-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
      }
    };

    // Determine if the button is completely un-interactable (either explicitly disabled, or currently loading).
    const isDisabled = disabled || isLoading;

    // A helper to cast motion.button to any to bypass React 19 type conflicts
    const MotionButton = motion.button as any;

    // Render a motion.button instead of a standard HTML button.
    return (
      <MotionButton
        // Attach the forwarded ref to the DOM node.
        ref={ref}
        // Use our bouncy spring for all hover/tap physics.
        transition={bouncySpring}
        // Only scale up on hover if the button is NOT disabled.
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        // Only scale down (press in) on click if the button is NOT disabled.
        whileTap={isDisabled ? undefined : { scale: 0.96 }}
        // Apply standard HTML disabled attribute if necessary.
        disabled={isDisabled}
        // Build the complex string of Tailwind utility classes.
        // 1. relative overflow-hidden: Contains inner glows.
        // 2. inline-flex items-center justify-center gap-2: Centers the icon and text with standard spacing.
        // 3. rounded-xl px-4 py-2: Standardized shape and padding.
        // 4. font-medium text-sm text-white: Clean, readable typography.
        // 5. transition-opacity: Smoothly fade when disabled.
        // 6. Conditionally apply opacity-50 and cursor-not-allowed if disabled.
        // 7. Inject the dynamically determined variant classes (gradients and glows).
        // 8. Append any custom className overrides.
        className={`relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium text-sm text-white transition-opacity duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} ${getVariantClasses()} ${className}`}
        // Pass any remaining HTML attributes down to the DOM node.
        {...props}
      >
        {/* If the button is loading, render a spinning loader icon instead of the custom icon. */}
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          /* If not loading, but a custom icon was provided, render it. */
          icon && <span className="shrink-0">{icon}</span>
        )}
        {/* Render the actual text inside the button. */}
        <span>{children}</span>
      </MotionButton>
    );
  }
);
// Assign a display name for React DevTools (necessary when using forwardRef).
NeonButton.displayName = 'NeonButton';
