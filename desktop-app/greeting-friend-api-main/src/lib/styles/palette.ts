// src/lib/styles/palette.ts - Palette ufficiale RescueManager (desktop/web)

export const PALETTE = {
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#60A5FA',

  bg: '#0A0E13',
  surface: '#1F2937',
  card: '#1C2128',
  cardElevated: '#252B33',
  border: '#374151',
  borderLight: '#4B5563',

  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  gradientStart: '#111827',
  gradientEnd: '#1F2937',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowLight: 'rgba(0, 0, 0, 0.2)'
} as const;

export type PaletteKeys = keyof typeof PALETTE;

