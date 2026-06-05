import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../lib/hooks/useTheme';

type Props = {
  width?: number | string;
  height?: number | string;
  variant?: 'rect' | 'circle';
  className?: string;
};

export const Skeleton = ({
  width = '100%',
  height = 20,
  variant = 'rect',
  className = '',
}: Props) => {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  const skeletonColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.05)';

  return (
    <Animated.View
      style={[
        { 
          width: typeof width === 'number' ? width : undefined, 
          height: typeof height === 'number' ? height : undefined,
          backgroundColor: skeletonColor,
        }, 
        animatedStyle
      ]}
      className={`${shapeClass} ${className}`}
    />
  );
};
