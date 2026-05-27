import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'calm', emoji: '😌', label: 'Calm' },
  { key: 'excited', emoji: '🤩', label: 'Excited' },
  { key: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'loving', emoji: '🥰', label: 'Loving' },
];

export default function MoodScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedMood) return;
    // Pass mood to the card screen via query params
    router.push(`/session/card?mood=${selectedMood}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>How are you feeling?</Text>
        <Text style={styles.subtitle}>
          Share your current mood before diving into today's question.
        </Text>

        <View style={styles.moodGrid}>
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.key;
            return (
              <TouchableOpacity
                key={mood.key}
                style={[styles.moodItem, isSelected && styles.moodItemSelected]}
                onPress={() => setSelectedMood(mood.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !selectedMood && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedMood}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  moodItem: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  moodItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  moodLabelSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
