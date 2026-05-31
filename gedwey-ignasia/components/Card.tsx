import React from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className = '', ...props }: Props) => {
  return (
    <View
      className={`bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
