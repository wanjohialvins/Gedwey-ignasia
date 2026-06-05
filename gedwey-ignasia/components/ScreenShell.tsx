import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
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

  const colors = variant === 'hero' ? heroColors : defaultColors;

  return (
    <View className={`flex-1 ${className}`} style={{ backgroundColor: theme.background }} {...props}>
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
};
