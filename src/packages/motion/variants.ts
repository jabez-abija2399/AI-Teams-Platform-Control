import { bouncySpring, smoothSpring } from './physics';

// This variant is applied to a parent container to stagger the entrance of its children.
// Extremely useful for lists, dashboards, or grids where items should cascade in.
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay each child by 0.1s
    },
  },
};

// This variant is applied to child elements inside a `staggerContainer`.
// It makes the element fade up gracefully from below.
export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: smoothSpring,
  },
};

// This variant creates the physical feeling of pressing a premium button or hovering a glass card.
// Apply this to `variants` and use `whileHover="hover"` and `whileTap="tap"`.
export const interactiveGlassVariant = {
  rest: { 
    scale: 1, 
    y: 0,
    boxShadow: '0px 0px 0px rgba(0,0,0,0)',
    borderColor: 'rgba(255,255,255,0.05)'
  },
  hover: { 
    scale: 1.02, 
    y: -4, 
    boxShadow: '0px 20px 40px rgba(0,0,0,0.4)', // Deep drop shadow when elevated
    borderColor: 'rgba(255,255,255,0.15)', // Border glows slightly
    transition: bouncySpring 
  },
  tap: { 
    scale: 0.97, // Physically presses in
    y: 0, 
    boxShadow: '0px 5px 10px rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.1)',
    transition: bouncySpring 
  },
};
