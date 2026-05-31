import React from 'react';
import { View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/hooks/useTheme';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hero';
};

export const ScreenShell = ({ children, className = '', variant = 'default', ...props }: Props) => {
  const { theme, isDark } = useTheme();

  const heroColors = isDark
    ? [theme.surface, theme.background, theme.background]
    : [theme.accentLight, theme.background, '#FFF1F2'];
  const defaultColors = isDark
    ? [theme.surface, theme.background]
    : [theme.accentLight, theme.background];

  if (variant === 'hero') {
    return (
      <View className={`flex-1 ${className}`} style={{ backgroundColor: theme.background }} {...props}>
        <LinearGradient
          colors={heroColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 280 }}
        />
        {children}
      </View>
    );
  }

  return (
    <View className={`flex-1 ${className}`} style={{ backgroundColor: theme.background }} {...props}>
      <LinearGradient
        colors={defaultColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }}
      />
      {children}
    </View>
  );
};
