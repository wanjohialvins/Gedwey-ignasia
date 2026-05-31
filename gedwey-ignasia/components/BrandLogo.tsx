import React from 'react';
import { Image, Text, View } from 'react-native';

type Props = {
  size?: number;
  showName?: boolean;
  compact?: boolean;
};

export const BrandLogo = ({ size = 56, showName = true, compact = false }: Props) => {
  return (
    <View className={`items-center ${compact ? 'flex-row gap-3' : ''}`}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: Math.max(12, size * 0.22) }}
        resizeMode="cover"
      />
      {showName ? (
        <View className={compact ? 'items-start' : 'items-center mt-3'}>
          <Text className="text-2xl font-bold text-primary-600">Gedwey Ignasia</Text>
          <Text className="text-sm text-text-secondary">intentional connection</Text>
        </View>
      ) : null}
    </View>
  );
};
