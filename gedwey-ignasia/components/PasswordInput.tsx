import React, { useState } from 'react';
import { Text, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Input } from './Input';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
  error?: string;
};

export const PasswordInput = ({ label, error, ...props }: Props) => {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative">
      <Input
        label={label}
        error={error}
        secureTextEntry={!visible}
        autoCapitalize="none"
        {...props}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        className="absolute right-3 top-[38px] px-2 py-1"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Text className="text-xs font-bold text-primary-600">{visible ? 'Hide' : 'Show'}</Text>
      </TouchableOpacity>
    </View>
  );
};
