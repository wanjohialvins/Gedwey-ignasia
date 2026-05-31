import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../lib/hooks/useTheme';

type ThemedTextProps = TextProps & {
  type?: 'primary' | 'secondary' | 'muted' | 'accent' | 'accentLight';
};

export const ThemedText = ({ type = 'primary', style, ...props }: ThemedTextProps) => {
  const { theme } = useTheme();

  let color = theme.textPrimary;
  if (type === 'secondary') {
    color = theme.textSecondary;
  } else if (type === 'muted') {
    color = theme.textTertiary;
  } else if (type === 'accent') {
    color = theme.accent;
  } else if (type === 'accentLight') {
    color = theme.accentLight;
  }

  return <Text style={[{ color }, style]} {...props} />;
};
