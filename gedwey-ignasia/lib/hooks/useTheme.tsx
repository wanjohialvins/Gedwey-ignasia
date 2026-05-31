import React, { createContext, useContext, useMemo } from 'react';
import { resolveTheme, ThemeId, ThemeTokens } from '../../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useUserProfile } from '../queries/profile';

type ThemeContextValue = {
  theme: ThemeTokens;
  themeId: ThemeId;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: resolveTheme('default'),
  themeId: 'default',
  isDark: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');

  const themeId = (profile?.theme_preference || 'default') as ThemeId;
  const theme = resolveTheme(themeId);
  const isDark = ['dark', 'midnight', 'forest', 'slate'].includes(themeId);

  const value = useMemo(() => ({ theme, themeId, isDark }), [theme, themeId, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
