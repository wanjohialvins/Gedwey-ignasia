import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../lib/hooks/useTheme';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className = '', style, ...props }: Props) => {
  const { theme } = useTheme();
  return (
    <View
      className={`p-4 rounded-2xl border shadow-sm ${className}`}
      style={[
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

