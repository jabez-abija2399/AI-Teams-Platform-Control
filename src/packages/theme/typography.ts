// This file defines the core typography settings for the platform.
// We mix a clean, geometric sans-serif for UI with a sleek monospaced font for technical details.

export const typography = {
  // 'sans' is the default font family for all UI elements (headers, body text, buttons).
  // 'Inter' provides excellent legibility and a modern aesthetic.
  sans: ['Inter', 'sans-serif'],
  
  // 'mono' is strictly reserved for code blocks, terminal outputs, and raw agent data.
  // 'JetBrains Mono' is highly readable and fits the "tech" theme.
  mono: ['JetBrains Mono', 'monospace'],

  // We define custom tracking (letter-spacing) to make the UI look tighter and more premium.
  tracking: {
    // Tighter spacing for display headings, giving a sleek, condensed look.
    tight: '-0.02em',
    // Normal spacing for body text to ensure readability.
    normal: '0em',
    // Wider spacing for uppercase badges or extremely small text.
    wide: '0.05em',
  }
} as const; // Export as a strict constant object to prevent accidental mutation.
