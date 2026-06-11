/**
 * Design System - Batatop App
 * Cores: Amarelo, Vermelho e Branco
 */

export const COLORS = {
  // Cores Primárias - Batatop Colors
  primary: '#FFB800', // Amarelo Batatop
  secondary: '#E61E2A', // Vermelho para detalhes
  accent: '#E6A800', // Amarelo escuro para hover/press
  white: '#FFFFFF',
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundLight: '#FDFDFD',
  backgroundElevated: '#F8F8F8',
  backgroundCard: '#FFFFFF',
  
  // Texto
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  textPrimary: '#FFB800',

  // Borders e Dividers
  border: '#EEEEEE',
  borderLight: '#F5F5F5',
  borderAccent: '#FFB800',

  // Status Colors
  success: '#27AE60',
  warning: '#F2C94C',
  error: '#EB5757',
  info: '#2D9CDB',
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    bold: 'System',
    semibold: 'System',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
};