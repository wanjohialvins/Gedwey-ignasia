import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <Animated.View
      style={[
        { 
          width: typeof width === 'number' ? width : undefined, 
          height: typeof height === 'number' ? height : undefined 
        }, 
        animatedStyle
      ]}
      className={`bg-gray-200 ${shapeClass} ${className}`}
    />
  );
};
