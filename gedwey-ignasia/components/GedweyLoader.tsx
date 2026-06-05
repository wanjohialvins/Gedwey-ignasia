import React, { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Svg, { Circle, G, Path, Rect, Defs, ClipPath } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedProps,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  title?: string;
  subtitle?: string;
  transparent?: boolean;
  mode?: 'determinate' | 'indeterminate';
  onFinished?: () => void;
};

export const GedweyLoader = ({
  title = 'Gedwey Ignasia',
  subtitle = 'loading your game...',
  transparent = false,
  mode = 'indeterminate',
  onFinished,
}: Props) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const ring = useSharedValue(0);
  const heart = useSharedValue(1);
  const flame = useSharedValue(0);
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const textGlow = useSharedValue(0);
  const dotOne = useSharedValue(0);
  const dotTwo = useSharedValue(0);
  const dotThree = useSharedValue(0);

  const outerRotation = useSharedValue(0);
  const innerRotation = useSharedValue(0);

  useEffect(() => {
    ring.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    
    outerRotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );
    innerRotation.value = withRepeat(
      withTiming(-360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    heart.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 300 }),
        withTiming(0.97, { duration: 300 }),
        withTiming(1.04, { duration: 300 }),
        withTiming(1, { duration: 1100 })
      ),
      -1,
      false
    );
    flame.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
    
    // Drive the progress shared value depending on the mode
    if (mode === 'determinate') {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 2500, easing: Easing.out(Easing.quad) }, (isFinished) => {
        if (isFinished && onFinished) {
          runOnJS(onFinished)();
        }
      });
    } else {
      progress.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    }

    shimmer.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.linear }), -1, false);
    textGlow.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    
    dotOne.value = withRepeat(
      withSequence(withTiming(1, { duration: 560 }), withTiming(0, { duration: 840 })),
      -1,
      false
    );
    const timer1 = setTimeout(() => {
      dotTwo.value = withRepeat(
        withSequence(withTiming(1, { duration: 560 }), withTiming(0, { duration: 840 })),
        -1,
        false
      );
    }, 200);
    const timer2 = setTimeout(() => {
      dotThree.value = withRepeat(
        withSequence(withTiming(1, { duration: 560 }), withTiming(0, { duration: 840 })),
        -1,
        false
      );
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [mode, onFinished]);

  const outerRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 1], [0.5, 1]),
    transform: [
      { scale: interpolate(ring.value, [0, 1], [1, 1.08]) },
      { rotate: `${outerRotation.value}deg` }
    ],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 1], [0.38, 0.95]),
    transform: [
      { scale: interpolate(ring.value, [0, 1], [0.84, 0.94]) },
      { rotate: `${innerRotation.value}deg` }
    ],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heart.value }],
    shadowOpacity: interpolate(textGlow.value, [0, 1], [0.3, 0.75]),
  }));

  const flameTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flame.value, [0, 1], [0.9, 0.72]),
    transform: [
      { scaleX: interpolate(flame.value, [0, 1], [1, 0.92]) },
      { scaleY: interpolate(flame.value, [0, 1], [1, 1.07]) },
      { rotate: `${interpolate(flame.value, [0, 1], [-1, 1.5])}deg` },
    ],
  }));

  const flameInnerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flame.value, [0, 1], [1, 0.85]),
    transform: [
      { scaleX: interpolate(flame.value, [0, 1], [1, 0.88]) },
      { scaleY: interpolate(flame.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-80, 190]) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(textGlow.value, [0, 1], [0.82, 1]),
    transform: [{ scale: interpolate(textGlow.value, [0, 1], [1, 1.02]) }],
  }));

  const dotStyle = (value: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: interpolate(value.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(value.value, [0, 1], [0.7, 1.2]) }],
    }));

  const dotOneStyle = dotStyle(dotOne);
  const dotTwoStyle = dotStyle(dotTwo);
  const dotThreeStyle = dotStyle(dotThree);

  // Animated properties for clipping paths
  const animatedPropsMain = useAnimatedProps(() => ({
    y: interpolate(progress.value, [0, 1], [110, 0]),
  }));

  const animatedPropsTop = useAnimatedProps(() => ({
    y: interpolate(progress.value, [0, 1], [110, 0]),
  }));

  const animatedPropsInner = useAnimatedProps(() => ({
    y: interpolate(progress.value, [0, 1], [110, 0]),
  }));

  const bgClass = transparent ? '' : isDark ? 'bg-slate-950' : 'bg-[#fff8ec]';
  const mainTitleColor = isDark ? '#a5b4fc' : '#c0460a';
  const subtitleColor = isDark ? '#94a3b8' : 'rgba(160, 80, 20, 0.7)';
  const progressBgClass = isDark ? 'bg-slate-800' : 'bg-[#78280040]';
  const progressFillClass = isDark ? 'bg-indigo-500' : 'bg-[#c0460a]';
  const outerBorderColor = isDark ? 'border-indigo-500/40' : 'border-[#c8501459]';
  const innerBorderColor = isDark ? 'border-pink-500/40' : 'border-[#dc821e66]';
  const dotBgClass1 = isDark ? 'bg-indigo-400' : 'bg-[#c0460a]';
  const dotBgClass2 = isDark ? 'bg-pink-400' : 'bg-[#e07820]';
  const dotBgClass3 = isDark ? 'bg-indigo-300' : 'bg-[#f5a623]';

  const heartOuterFill = isDark ? '#1e1b4b' : '#8B1A00';
  const heartOuterStroke = isDark ? '#6366f1' : '#c0460a';
  const heartMiddleFill = isDark ? '#3730a3' : '#c0340a';
  const heartInnerFill = isDark ? '#4f46e5' : '#d94a12';
  const flameOuterColor = isDark ? '#f43f5e' : '#e07820';
  const flameInnerColor = isDark ? '#f472b6' : '#f5a623';
  const flameCoreColor = isDark ? '#fdf2f8' : '#fff5d0';

  return (
    <View className={`flex-1 items-center justify-center px-4 ${bgClass}`}>
      <View className="min-h-[340px] items-center justify-center py-12">
        <View className="relative w-[130px] h-[160px] items-center justify-center">
          {/* Outer Ring */}
          <Animated.View
            className={`absolute w-[130px] h-[130px] rounded-full border-2 border-dashed ${outerBorderColor}`}
            style={outerRingStyle}
          />
          {/* Inner Ring */}
          <Animated.View
            className={`absolute w-[108px] h-[108px] rounded-full border-2 border-dashed ${innerBorderColor}`}
            style={innerRingStyle}
          />

          <Animated.View
            style={[
              {
                width: 90,
                height: 110,
                shadowColor: isDark ? '#6366f1' : '#dc500a',
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 0 },
              },
              heartStyle,
            ]}
          >
            <Svg width={90} height={110} viewBox="0 0 90 110">
              <Defs>
                <ClipPath id="progressClipMain">
                  <AnimatedRect
                    x={0}
                    width={90}
                    height={110}
                    animatedProps={animatedPropsMain}
                  />
                </ClipPath>
              </Defs>

              {/* Side decorative curves */}
              <G opacity={0.55} stroke={heartOuterStroke} strokeWidth={1.2} fill="none">
                <Path d="M18 52 Q8 44 10 34 Q12 26 20 30" />
                <Path d="M14 54 Q4 50 5 40" />
                <Path d="M72 52 Q82 44 80 34 Q78 26 70 30" />
                <Path d="M76 54 Q86 50 85 40" />
              </G>

              {/* Background empty dashed/hollow heart */}
              <Path
                d="M45 88 C20 68 8 52 8 38 C8 24 18 16 28 16 C35 16 41 20 45 26 C49 20 55 16 62 16 C72 16 82 24 82 38 C82 52 70 68 45 88Z"
                fill={isDark ? 'rgba(30, 27, 75, 0.15)' : 'rgba(139, 26, 0, 0.05)'}
                stroke={heartOuterStroke}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* Rising filled layers - clipped inside progressClipMain */}
              <G clipPath="url(#progressClipMain)">
                <Path
                  d="M45 88 C20 68 8 52 8 38 C8 24 18 16 28 16 C35 16 41 20 45 26 C49 20 55 16 62 16 C72 16 82 24 82 38 C82 52 70 68 45 88Z"
                  fill={heartOuterFill}
                  stroke={heartOuterStroke}
                  strokeWidth={1.5}
                />
                <Path
                  d="M45 80 C24 62 14 48 14 37 C14 27 21 22 29 22 C36 22 41 26 45 32 C49 26 54 22 61 22 C69 22 76 27 76 37 C76 48 66 62 45 80Z"
                  fill={heartMiddleFill}
                />
                <Path
                  d="M45 76 C27 60 18 47 18 37 C18 30 23 25 30 25 C36 25 41 29 45 35 C49 29 54 25 60 25 C67 25 72 30 72 37 C72 47 63 60 45 76Z"
                  fill={heartInnerFill}
                />

                <Circle cx={25} cy={60} r={2} fill={flameInnerColor} opacity={0.6} />
                <Circle cx={65} cy={58} r={1.5} fill={flameInnerColor} opacity={0.5} />
                <Circle cx={20} cy={44} r={1.5} fill={flameOuterColor} opacity={0.4} />
                <Circle cx={70} cy={46} r={1.8} fill={flameInnerColor} opacity={0.5} />
              </G>
            </Svg>
            
            {/* Top Flame overlay (clipped to progressClipTop) */}
            <Animated.View className="absolute inset-0" style={flameTopStyle}>
              <Svg width={90} height={110} viewBox="0 0 90 110">
                <Defs>
                  <ClipPath id="progressClipTop">
                    <AnimatedRect
                      x={0}
                      width={90}
                      height={110}
                      animatedProps={animatedPropsTop}
                    />
                  </ClipPath>
                </Defs>
                <G clipPath="url(#progressClipTop)">
                  <Path
                    d="M45 28 C42 20 36 14 38 6 C33 12 30 20 33 30 C28 24 26 14 30 8 C24 16 22 26 27 34 C22 30 20 22 22 14 C16 24 18 36 26 42"
                    fill={flameOuterColor}
                    opacity={0.85}
                  />
                  <Path
                    d="M45 28 C48 20 54 14 52 6 C57 12 60 20 57 30 C62 24 64 14 60 8 C66 16 68 26 63 34 C68 30 70 22 68 14 C74 24 72 36 64 42"
                    fill={flameOuterColor}
                    opacity={0.85}
                  />
                  <Path d="M45 30 C45 14 40 6 44 0 C47 6 50 14 45 30Z" fill={flameInnerColor} opacity={0.9} />
                </G>
              </Svg>
            </Animated.View>
            
            {/* Inner Flame overlay (clipped to progressClipInner) */}
            <Animated.View className="absolute inset-0" style={flameInnerStyle}>
              <Svg width={90} height={110} viewBox="0 0 90 110">
                <Defs>
                  <ClipPath id="progressClipInner">
                    <AnimatedRect
                      x={0}
                      width={90}
                      height={110}
                      animatedProps={animatedPropsInner}
                    />
                  </ClipPath>
                </Defs>
                <G clipPath="url(#progressClipInner)">
                  <Path
                    d="M45 30 C43 22 40 16 42 10 C39 15 38 22 40 28 C38 24 37 17 39 12 C36 18 36 26 39 32"
                    fill={flameInnerColor}
                    opacity={0.8}
                  />
                  <Path
                    d="M45 30 C47 22 50 16 48 10 C51 15 52 22 50 28 C52 24 53 17 51 12 C54 18 54 26 51 32"
                    fill={flameInnerColor}
                    opacity={0.8}
                  />
                  <Path d="M45 30 C45 18 43 10 45 4 C47 10 45 18 45 30Z" fill={flameCoreColor} opacity={0.75} />
                </G>
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            {
              color: mainTitleColor,
              fontFamily: 'serif',
              fontSize: 17,
              fontWeight: '600',
              letterSpacing: 2,
              marginTop: 22,
              textShadowColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(220, 100, 10, 0.6)',
              textShadowRadius: 18,
            },
            titleStyle,
          ]}
        >
          {title}
        </Animated.Text>
        
        <Text
          style={{
            color: subtitleColor,
            fontFamily: 'serif',
            fontSize: 12,
            letterSpacing: 1,
            marginTop: 6,
          }}
        >
          {subtitle}
        </Text>

        {/* Progress Bar Container */}
        <View className={`w-[180px] h-1 rounded-full overflow-hidden mt-8 ${progressBgClass}`}>
          <Animated.View className={`h-full rounded-full overflow-hidden ${progressFillClass}`} style={barStyle}>
            <Animated.View className="absolute top-0 bottom-0 w-16 bg-white/40" style={shimmerStyle} />
          </Animated.View>
        </View>

        {/* Interactive indicator dots */}
        <View className="flex-row items-center gap-2 mt-5">
          <Animated.View className={`w-[7px] h-[7px] rounded-full ${dotBgClass1}`} style={dotOneStyle} />
          <Animated.View className={`w-[7px] h-[7px] rounded-full ${dotBgClass2}`} style={dotTwoStyle} />
          <Animated.View className={`w-[7px] h-[7px] rounded-full ${dotBgClass3}`} style={dotThreeStyle} />
        </View>
      </View>
    </View>
  );
};
