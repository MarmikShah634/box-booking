export const Colors = {
  primary: '#dc2626',       // red-600
  primaryLight: '#fef2f2',  // red-50
  primaryDark: '#b91c1c',   // red-700

  // Dark surfaces
  bg: '#09090b',            // zinc-950
  surface: '#18181b',       // zinc-900
  surfaceAlt: '#27272a',    // zinc-800
  border: '#3f3f46',        // zinc-700

  // Text
  textPrimary: '#fafafa',   // zinc-50
  textSecondary: '#a1a1aa', // zinc-400
  textMuted: '#71717a',     // zinc-500

  // Semantic
  white: '#ffffff',
  error: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  emerald: '#059669',       // for positive indicators
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;
