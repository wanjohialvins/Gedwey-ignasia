import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: Props) => {
  const isPrimary = variant === 'primary';
  
  const baseStyle = 'h-12 px-4 py-3 rounded-xl flex-row items-center justify-center';
  const variantStyle = isPrimary
    ? 'bg-primary-600 active:bg-primary-500'
    : 'bg-primary-100 active:bg-blue-200';
  
  const textStyle = isPrimary
    ? 'text-white font-semibold text-base'
    : 'text-primary-600 font-semibold text-base';
    
  const disabledStyle = (disabled || loading) ? 'opacity-60' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={isPrimary ? '#FFFFFF' : '#2563EB'} 
          size="small" 
          className="mr-2"
        />
      ) : null}
      <Text className={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};
