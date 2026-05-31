import React from 'react';
import { Text, View } from 'react-native';
import { DEV_MODE } from '../lib/devMode';

export const DevBadge = () => {
  if (!DEV_MODE) return null;

  return (
    <View className="bg-amber-500 px-2 py-0.5 rounded-md">
      <Text className="text-[10px] font-bold text-white tracking-widest">DEV</Text>
    </View>
  );
};
