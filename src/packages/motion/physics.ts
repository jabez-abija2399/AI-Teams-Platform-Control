// This file defines the core physics configurations for Framer Motion.
// By centralizing spring physics, we ensure all animations across the platform feel consistent.

// Use this for interactive elements like buttons that need a snappy, slightly bouncy feel when hovered or clicked.
export const bouncySpring = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
} as const;

// Use this for large layout transitions, page loads, or modal opening.
// It feels fluid, smooth, and heavily damped to prevent jarring movements.
export const smoothSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 40,
} as const;

// Use this for extremely subtle micro-interactions (e.g., color fading, subtle opacity shifts).
export const subtleTransition = {
  duration: 0.3,
  ease: 'easeInOut',
};
