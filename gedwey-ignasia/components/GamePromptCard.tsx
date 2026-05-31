import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { GameCard } from '../lib/queries/gameCards';
import type { GameMode } from '../lib/gamePrompts';
import { CATEGORY_LABELS } from '../lib/gamePrompts';

const CATEGORY_STYLES: Record<string, { border: string; bg: string; accent: string; label: string }> = {
  fun: { border: 'border-rose-200', bg: 'bg-rose-50/80', accent: '#E11D48', label: 'text-rose-600' },
  deep: { border: 'border-indigo-200', bg: 'bg-indigo-50/80', accent: '#4F46E5', label: 'text-indigo-600' },
  playful: { border: 'border-amber-200', bg: 'bg-amber-50/80', accent: '#D97706', label: 'text-amber-700' },
  mature: { border: 'border-red-300', bg: 'bg-red-50/90', accent: '#8B1A2F', label: 'text-red-800' },
};

type Props = {
  card: GameCard | null;
  mode: GameMode;
  cardKey: string;
};

export const GamePromptCard = ({ card, mode, cardKey }: Props) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);
  const slideA = useSharedValue(-120);
  const slideB = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    scale.value = 0.92;
    rotateY.value = 0;
    slideA.value = -120;
    slideB.value = 120;
    opacity.value = 0;

    if (!card) return;

    opacity.value = withTiming(1, { duration: 320 });

    switch (mode) {
      case 'truth_or_dare':
        rotateY.value = withSequence(
          withTiming(90, { duration: 180, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.out(Easing.back(1.2)) })
        );
        scale.value = withSpring(1, { damping: 14, stiffness: 120 });
        break;
      case 'would_you_rather':
        slideA.value = withSpring(0, { damping: 16, stiffness: 140 });
        slideB.value = withSpring(0, { damping: 16, stiffness: 140 });
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        break;
      case 'this_or_that':
        scale.value = withSequence(
          withSpring(1.06, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 160 })
        );
        break;
      case 'rapid_fire':
        scale.value = withRepeat(
          withSequence(withTiming(1.04, { duration: 400 }), withTiming(1, { duration: 400 })),
          3,
          true
        );
        progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
        break;
      case 'deep_questions':
        scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(1, { duration: 600 });
        break;
      default:
        scale.value = withSpring(1);
    }
  }, [cardKey, mode, card?.id]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { perspective: 800 }, { rotateY: `${rotateY.value}deg` }],
  }));

  const optionAStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideA.value }],
    opacity: opacity.value,
  }));

  const optionBStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideB.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
  }));

  if (!card) {
    return (
      <View className="p-6 min-h-[260px] justify-center items-center bg-white rounded-2xl border border-slate-200">
        <Text className="text-text-secondary text-center">No prompts match this filter. Try another category.</Text>
      </View>
    );
  }

  const style = CATEGORY_STYLES[card.category] || CATEGORY_STYLES.fun;
  const isTruthOrDare = mode === 'truth_or_dare';
  const isWyr = mode === 'would_you_rather';
  const isTot = mode === 'this_or_that';

  return (
    <Animated.View
      key={cardKey}
      style={containerStyle}
      className={`p-6 min-h-[260px] rounded-2xl border-2 ${style.border} ${style.bg} shadow-sm`}
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-xs font-bold uppercase tracking-widest ${style.label}`}>
          {isTruthOrDare ? (card.is_dare ? 'Dare' : 'Truth') : CATEGORY_LABELS[card.category]}
        </Text>
        {mode === 'rapid_fire' ? (
          <Animated.View style={pulseStyle} className="bg-red-500 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-white">FAST</Text>
          </Animated.View>
        ) : null}
      </View>

      {isWyr && card.option_a && card.option_b ? (
        <View className="gap-3 flex-1 justify-center">
          <Animated.View style={optionAStyle} className="bg-white/90 rounded-xl p-4 border border-white">
            <Text className="text-xs font-bold text-slate-500 mb-1">A</Text>
            <Text className="text-lg font-bold text-text-primary">{card.option_a}</Text>
          </Animated.View>
          <Text className="text-center text-sm font-bold text-text-secondary">OR</Text>
          <Animated.View style={optionBStyle} className="bg-white/90 rounded-xl p-4 border border-white">
            <Text className="text-xs font-bold text-slate-500 mb-1">B</Text>
            <Text className="text-lg font-bold text-text-primary">{card.option_b}</Text>
          </Animated.View>
          <Text className="text-sm text-text-secondary mt-2 leading-normal">{card.prompt}</Text>
        </View>
      ) : isTot && card.option_a && card.option_b ? (
        <View className="flex-1 justify-center">
          <Text className="text-2xl font-bold text-text-primary text-center leading-relaxed">
            {card.option_a} <Text className="text-text-secondary">or</Text> {card.option_b}?
          </Text>
        </View>
      ) : (
        <Text className="text-2xl font-bold text-text-primary leading-relaxed flex-1">
          {isTruthOrDare ? card.prompt : card.prompt}
        </Text>
      )}
    </Animated.View>
  );
};
