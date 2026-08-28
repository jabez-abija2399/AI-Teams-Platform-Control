// This file defines the core color palette for the entire application.
// We strictly use HSL (Hue, Saturation, Lightness) values without the `hsl()` wrapper.
// This allows Tailwind CSS to dynamically apply opacity modifiers (e.g., bg-void/50).
export const colors = {
  // The 'void' is our darkest background color, representing deep space.
  // It has a hue of 240 (blue/indigo), 40% saturation for richness, and 2% lightness for near-black.
  void: '240 40% 2%',
  
  // The 'surface' is slightly lighter than the void, used for elevated elements like cards.
  surface: '240 20% 6%',
  
  // 'surface-glass' is the base color for translucent elements, meant to be used with backdrop-blur.
  surfaceGlass: '240 20% 6%',
  
  // 'surface-hover' is a slightly brighter version of the surface for interactive states.
  surfaceHover: '240 20% 10%',

  // 'primary' is our main brand color: Electric Indigo. It provides high contrast against the void.
  primary: '250 100% 65%',
  
  // 'secondary' is Cyber Cyan, used for gradients and secondary actions.
  secondary: '190 100% 50%',
  
  // 'success' is Emerald Matrix, used for healthy pipeline states and completed tasks.
  success: '150 100% 50%',
  
  // 'warning' is Solar Orange, used for paused states or non-critical alerts.
  warning: '35 100% 55%',
  
  // 'danger' is Crimson Red, used for failed pipelines or destructive actions.
  danger: '350 100% 60%',

  text: {
    // Pure white for primary readable text to contrast with the dark backgrounds.
    primary: '0 0% 100%',
    
    // Muted silver-blue for secondary text like descriptions or subtitles.
    secondary: '240 10% 70%',
    
    // Darker grey for placeholders or extremely subtle tertiary text.
    tertiary: '240 10% 40%',
  }
} as const; // Export as a strict constant object to prevent accidental mutation.
