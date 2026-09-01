/** Technical Precision design tokens — synced with desing/hibirdev_ai_core/DESIGN.md */
export const colors = {
  void: '#000000',
  background: '#0e1414',
  surface: '#0e1414',
  surfaceContainerLowest: '#090f0f',
  surfaceContainerLow: '#171d1d',
  surfaceContainer: '#1b2121',
  surfaceContainerHigh: '#252b2b',
  surfaceContainerHighest: '#303636',
  onSurface: '#dee4e3',
  onSurfaceVariant: '#bbc9c8',
  onBackground: '#dee4e3',
  primary: '#56d9d9',
  primaryContainer: '#00acac',
  onPrimary: '#003737',
  secondary: '#c6c7c2',
  outline: '#869393',
  outlineVariant: '#3c4949',
  error: '#ffb4ab',
  success: '#00ACAC',
  warning: '#F59E0B',
  danger: '#ffb4ab',
  borderDark: '#464545',
  offWhite: '#DFDEDC',
} as const;

export const spacing = {
  unit: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 48,
  xl: 64,
  gridLine: 0.5,
} as const;

export const radius = {
  sm: '0.125rem',
  default: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
} as const;
