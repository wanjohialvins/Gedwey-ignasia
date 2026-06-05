import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../lib/hooks/useTheme';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
};

export const Card = ({ children, className = '', style, glass = true, ...props }: Props) => {
  const { theme, isDark } = useTheme();

  const cardStyle = glass
    ? {
        backgroundColor: isDark ? 'rgba(28, 28, 31, 0.52)' : 'rgba(255, 255, 255, 0.62)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      }
    : {
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
      };

  return (
    <View
      className={`p-4 rounded-2xl border shadow-sm ${className}`}
      style={[
        cardStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

