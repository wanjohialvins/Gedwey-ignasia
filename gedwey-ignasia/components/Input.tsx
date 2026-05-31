import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { AppIcon } from './AppIcon';
import { useTheme } from '../lib/hooks/useTheme';

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
  style,
  ...props
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isSecure = secureTextEntry && !passwordVisible;
  const { theme } = useTheme();

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

  const borderColor = error
    ? '#EF4444'
    : isFocused
    ? theme.accent
    : theme.border;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
          {label}
        </Text>
      ) : null}
      
      <View className="relative">
        <TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          className={`h-12 border px-4 rounded-xl text-base ${showPasswordToggle ? 'pr-12' : ''}`}
          style={[
            {
              backgroundColor: theme.surface,
              borderColor,
              color: theme.textPrimary,
            },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          {...props}
        />
        {showPasswordToggle && secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((v) => !v)}
            className="absolute right-3 top-0 bottom-0 justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
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

