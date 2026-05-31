import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { AppIcon } from './AppIcon';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
  showPasswordToggle?: boolean;
};

export const Input = ({
  label,
  error,
  containerClassName = '',
  showPasswordToggle = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isSecure = secureTextEntry && !passwordVisible;

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
      
      <View className="relative">
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          className={`h-12 border px-4 rounded-xl text-base text-text-primary bg-white ${borderStyle} ${showPasswordToggle ? 'pr-12' : ''}`}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {showPasswordToggle && secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((v) => !v)}
            className="absolute right-3 top-0 bottom-0 justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {error ? (
        <Text className="text-xs text-red-500 mt-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
