import React from 'react';
import { Text, View } from 'react-native';
import { useNetworkStore } from '../lib/networkStatus';

export const OfflineBanner = () => {
  const isOnline = useNetworkStore((s) => s.isOnline);
  if (isOnline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2">
      <Text className="text-xs font-bold text-white text-center">You are offline — showing saved data where available</Text>
    </View>
  );
};
