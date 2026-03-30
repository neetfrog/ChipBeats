export type ThemeMode = 'retro' | 'dark' | 'high-contrast';

export interface Theme {
  mode: ThemeMode;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    border: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  scanlines: boolean;
  crtEffect: boolean;
}

const RETRO_THEME: Theme = {
  mode: 'retro',
  colors: {
    bg: '#0f0e1e',
    bgSecondary: '#1a1a33',
    bgTertiary: '#2a2a4a',
    border: '#444466',
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    textTertiary: '#606080',
    accent: '#4ade80',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#ef4444',
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 4px 16px rgba(0, 0, 0, 0.6)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.8)',
  },
  scanlines: true,
  crtEffect: true,
};

const DARK_THEME: Theme = {
  mode: 'dark',
  colors: {
    bg: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2a2a2a',
    border: '#333333',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textTertiary: '#707070',
    accent: '#00d084',
    success: '#00d084',
    warning: '#ffa500',
    danger: '#ff4444',
  },
  shadows: {
    sm: '0 2px 12px rgba(0, 0, 0, 0.5)',
    md: '0 4px 24px rgba(0, 0, 0, 0.7)',
    lg: '0 8px 48px rgba(0, 0, 0, 0.9)',
  },
  scanlines: false,
  crtEffect: false,
};

const HIGH_CONTRAST_THEME: Theme = {
  mode: 'high-contrast',
  colors: {
    bg: '#000000',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#333333',
    border: '#ffffff',
    text: '#ffffff',
    textSecondary: '#ffff00',
    textTertiary: '#00ffff',
    accent: '#00ff00',
    success: '#00ff00',
    warning: '#ffff00',
    danger: '#ff0000',
  },
  shadows: {
    sm: '0 0 4px #00ff00',
    md: '0 0 8px #00ff00',
    lg: '0 0 16px #00ff00',
  },
  scanlines: true,
  crtEffect: false,
};

export function getTheme(mode: ThemeMode): Theme {
  switch (mode) {
    case 'retro':
      return RETRO_THEME;
    case 'dark':
      return DARK_THEME;
    case 'high-contrast':
      return HIGH_CONTRAST_THEME;
    default:
      return DARK_THEME;
  }
}
