export type ThemeId = 'default' | 'dark' | 'midnight' | 'rose' | 'forest' | 'cream' | 'slate' | 'soft';

export type ThemeTokens = {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  cardBackground: string;
  tabBarBackground: string;
};

export const SOFT_BLUE = '#4F8EF7';
export const PURPLE_ACCENT = '#7F77DD';
export const ROSE_ACCENT = '#D4537E';
export const MATURE_BURGUNDY = '#8B1A2F';

export const THEMES: Record<ThemeId, ThemeTokens> = {
  default: {
    background: '#FAFAF9',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    accent: PURPLE_ACCENT,
    accentLight: '#EDE9FE',
    accentSoft: SOFT_BLUE,
    cardBackground: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
  },
  dark: {
    background: '#111113',
    surface: '#1C1C1F',
    border: '#2E2E33',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    accent: '#9B94F5',
    accentLight: '#312E81',
    accentSoft: SOFT_BLUE,
    cardBackground: '#1C1C1F',
    tabBarBackground: '#111113',
  },
  midnight: {
    background: '#0D1B2A',
    surface: '#1B263B',
    border: '#415A77',
    textPrimary: '#E0E1DD',
    textSecondary: '#778DA9',
    textTertiary: '#415A77',
    accent: SOFT_BLUE,
    accentLight: '#1E3A5F',
    accentSoft: SOFT_BLUE,
    cardBackground: '#1B263B',
    tabBarBackground: '#0D1B2A',
  },
  rose: {
    background: '#FFF5F7',
    surface: '#FFFFFF',
    border: '#FECDD3',
    textPrimary: '#881337',
    textSecondary: '#BE123C',
    textTertiary: '#FDA4AF',
    accent: ROSE_ACCENT,
    accentLight: '#FFE4E6',
    accentSoft: ROSE_ACCENT,
    cardBackground: '#FFFFFF',
    tabBarBackground: '#FFF5F7',
  },
  forest: {
    background: '#0F1A12',
    surface: '#1A2E1F',
    border: '#2D4A35',
    textPrimary: '#ECFDF5',
    textSecondary: '#86EFAC',
    textTertiary: '#4ADE80',
    accent: '#1D9E75',
    accentLight: '#064E3B',
    accentSoft: '#1D9E75',
    cardBackground: '#1A2E1F',
    tabBarBackground: '#0F1A12',
  },
  cream: {
    background: '#FAF6EF',
    surface: '#FFFFFF',
    border: '#E7DCC8',
    textPrimary: '#44403C',
    textSecondary: '#78716C',
    textTertiary: '#A8A29E',
    accent: '#BA7517',
    accentLight: '#FEF3C7',
    accentSoft: '#BA7517',
    cardBackground: '#FFFFFF',
    tabBarBackground: '#FAF6EF',
  },
  slate: {
    background: '#1C2333',
    surface: '#252D3D',
    border: '#3D4A5C',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    accent: PURPLE_ACCENT,
    accentLight: '#312E81',
    accentSoft: SOFT_BLUE,
    cardBackground: '#252D3D',
    tabBarBackground: '#1C2333',
  },
  soft: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    accent: SOFT_BLUE,
    accentLight: '#DBEAFE',
    accentSoft: SOFT_BLUE,
    cardBackground: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
  },
};

export const resolveTheme = (preference?: string | null): ThemeTokens => {
  const id = (preference || 'default') as ThemeId;
  return THEMES[id] ?? THEMES.default;
};
