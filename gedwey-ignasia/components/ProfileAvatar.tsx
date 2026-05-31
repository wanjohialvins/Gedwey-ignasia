import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../lib/hooks/useTheme';

type Props = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  showBorder?: boolean;
};

export const ProfileAvatar = ({ uri, name, size = 44, className = '', showBorder = true }: Props) => {
  const { theme } = useTheme();
  const initial = (name || 'G').slice(0, 1).toUpperCase();

  return (
    <View
      className={`rounded-full overflow-hidden items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: theme.accentLight,
        borderWidth: showBorder ? 2 : 0,
        borderColor: theme.accent + '40',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: theme.accent, fontSize: size * 0.38, fontWeight: '700' }}>{initial}</Text>
      )}
    </View>
  );
};
