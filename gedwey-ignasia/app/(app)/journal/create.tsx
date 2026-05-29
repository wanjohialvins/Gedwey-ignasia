import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateJournalEntry } from '../../../lib/queries/journal';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

export default function JournalCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const { data: profile } = useUserProfile(user?.id ?? '');
  const createEntry = useCreateJournalEntry();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your journal entry.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please write something in your journal entry.');
      return;
    }

    const coupleId = profile?.couple_id;
    const userId = user?.id;

    if (!coupleId || !userId) {
      Alert.alert('Error', 'Unable to identify couple identity. Make sure you are paired.');
      return;
    }

    try {
      await createEntry.mutateAsync({
        coupleId,
        creatorId: userId,
        title: title.trim(),
        content: content.trim(),
      });
      router.replace('/journal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save your journal entry.');
    }
  };

  const isPending = createEntry.isPending;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
            <Text className="text-primary-600 text-sm font-semibold">← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-text-primary">New Memory</Text>
          <Text className="text-sm text-text-secondary mt-1 mb-6 leading-relaxed">
            Capture a special moment, milestone, or reflection together.
          </Text>

          <View className="flex-1 gap-4">
            {/* Title Input */}
            <Input
              label="Title"
              placeholder="Give this moment a name..."
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Content Input */}
            <Input
              label="Memory Details"
              placeholder="What happened? How did it feel? Write down the details..."
              multiline
              numberOfLines={8}
              value={content}
              onChangeText={setContent}
              className="h-44 text-left py-3.5"
            />

            <Button
              title="Save to Journal"
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || isPending}
              loading={isPending}
              className="w-full mt-2 mb-6"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
