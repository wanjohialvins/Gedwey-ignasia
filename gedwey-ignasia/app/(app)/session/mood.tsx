import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../../components/Button';

const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'calm', emoji: '😌', label: 'Calm' },
  { key: 'excited', emoji: '🤩', label: 'Excited' },
  { key: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'loving', emoji: '🥰', label: 'Loving' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
];

export default function MoodScreen() {
  const router = useRouter();
  const { deck } = useLocalSearchParams<{ deck: string }>();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedMood) return;
    // Pass mood and deck to the card screen via query params
    router.push(`/session/card?mood=${selectedMood}&deck=${deck || ''}`);
  };

  return (
    <View className="flex-1 bg-background px-4 pt-16 pb-6 justify-between">
      <TouchableOpacity className="self-start py-1 mb-2" onPress={() => router.back()}>
        <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
      </TouchableOpacity>

      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-text-primary text-center mb-2">How are you feeling?</Text>
        <Text className="text-sm text-text-secondary text-center px-4 leading-relaxed mb-8">
          Share your current mood before diving into today's question.
        </Text>

        <View className="flex-row flex-wrap justify-center gap-3">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.key;
            return (
              <TouchableOpacity
                key={mood.key}
                style={{ borderWidth: isSelected ? 2 : 1 }}
                className={`w-[80px] h-[80px] bg-white rounded-2xl items-center justify-center shadow-sm ${
                  isSelected ? 'border-primary-600 bg-primary-100/50' : 'border-neutral-border'
                }`}
                onPress={() => setSelectedMood(mood.key)}
                activeOpacity={0.8}
              >
                <Text className="text-3xl mb-1">{mood.emoji}</Text>
                <Text 
                  className={`text-[10px] font-semibold ${
                    isSelected ? 'text-primary-600' : 'text-text-secondary'
                  }`}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!selectedMood}
      />
    </View>
  );
}
