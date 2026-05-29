import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = ({
  label,
  error,
  containerClassName = '',
  onFocus,
  onBlur,
  ...props
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const borderStyle = error
    ? 'border-red-500'
    : isFocused
    ? 'border-primary-500'
    : 'border-neutral-border';

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </Text>
      ) : null}
      
      <TextInput
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`h-12 border px-4 rounded-xl text-base text-text-primary bg-white ${borderStyle}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      
      {error ? (
        <Text className="text-xs text-red-500 mt-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
