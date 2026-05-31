import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../lib/hooks/useTheme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: any;
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  style,
}: Props) => {
  const isPrimary = variant === 'primary';
  const { theme } = useTheme();
  
  const baseStyle = 'h-12 px-4 py-3 rounded-xl flex-row items-center justify-center';
  
  const customStyle = isPrimary
    ? {
        backgroundColor: theme.accent,
      }
    : {
        backgroundColor: theme.accentLight,
      };
      
  const textStyle = {
    color: isPrimary ? '#FFFFFF' : theme.accent,
    fontWeight: '600' as const,
    fontSize: 16,
  };
    
  const disabledStyle = (disabled || loading) ? 'opacity-60' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${disabledStyle} ${className}`}
      style={[customStyle, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={isPrimary ? '#FFFFFF' : theme.accent} 
          size="small" 
          className="mr-2"
        />
      ) : null}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

