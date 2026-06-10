/**
 * Design System - Tokens de Design iFood Premium
 * Baseado em: Linear Modern + Frontend Pro + Visual Balance
 */

export const COLORS = {
  // Cores Primárias - iFood Red
  primary: '#E63946',
  primaryLight: '#F77F88',
  primaryDark: '#A4161A',
  primaryGhost: 'rgba(230, 57, 70, 0.1)',

  // Cores Neutras - Dark Mode Premium
  background: '#0F1419',
  backgroundElevated: '#1A1F2E',
  backgroundCard: '#252D3D',
  backgroundCardHover: '#2F3A4F',

  // Texto
  text: '#FFFFFF',
  textSecondary: '#B4BCC4',
  textMuted: '#7A8490',
  textInverse: '#0F1419',

  // Borders e Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderAccent: 'rgba(230, 57, 70, 0.3)',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Gradientes
  gradientPrimary: ['#E63946', '#F77F88'],
  gradientDark: ['#0F1419', '#1A1F2E'],
};

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: 'System',
    bold: 'System',
    semibold: 'System',
  },

  // Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Weights
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const SPACING = {
  // 4px grid
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const SHADOWS = {
  // Shadows - Multi-layer para profundidade
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  // Glow effect para elementos primários
  glow: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const ANIMATIONS = {
  // Timing
  fast: 200,
  normal: 300,
  slow: 500,

  // Easing (expo-out)
  easing: [0.16, 1, 0.3, 1],
};

// Preset Styles
export const PRESET_STYLES = {
  // Buttons
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },

  buttonSecondary: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Cards
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },

  cardHover: {
    backgroundColor: COLORS.backgroundCardHover,
    borderColor: COLORS.borderAccent,
    ...SHADOWS.lg,
  },

  // Input
  input: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    color: COLORS.text,
  },
};
