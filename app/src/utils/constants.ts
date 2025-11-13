/**
 * Theme Constants
 * Based on PRD specifications for Islamic aesthetic
 */

export const COLORS = {
  // Primary Colors
  primary: '#006B5E',
  primaryDark: '#004D40',
  primaryLight: '#00897B',

  // Secondary Colors
  secondary: '#F9A825',
  secondaryDark: '#F57F17',
  secondaryLight: '#FBC02D',

  // Background Colors
  background: '#FAFAFA',
  backgroundAlt: '#FFFFFF',
  cream: '#FFF8E1',

  // Text Colors
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',

  // Accent Colors
  accent: '#1976D2',
  accentLight: '#42A5F5',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#E0E0E0',
  darkGray: '#424242',
};

export const DIMENSIONS = {
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },

  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Icon Sizes
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  // Arabic fonts will use system defaults
  // iOS: SF Arabic
  // Android: Noto Naskh Arabic
};

export const AUDIO_QUALITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const REPEAT_MODE = {
  OFF: 'off',
  ONE: 'one',
  ALL: 'all',
} as const;

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const DOWNLOAD_STATUS = {
  NOT_DOWNLOADED: 'not_downloaded',
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
