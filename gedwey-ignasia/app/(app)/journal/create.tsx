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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateJournalEntry } from '../../../lib/queries/journal';
import { useSessionSoundscape } from '../../../lib/hooks/useSessionSoundscape';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { ScreenShell } from '../../../components/ScreenShell';
import { VoiceNoteRecorder } from '../../../components/VoiceNoteRecorder';
import { supabase } from '../../../lib/supabase';
import { uriToUint8Array } from '../../../lib/fileUtils';
import { useTheme } from '../../../lib/hooks/useTheme';

export default function JournalCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  const { data: profile } = useUserProfile(user?.id ?? '');
  const createEntry = useCreateJournalEntry();
  useSessionSoundscape(profile);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Photo State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Voice Note State
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number | null>(null);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Enable photo library access to upload a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;
    setSelectedPhoto(result.assets[0].uri);
  };

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

    setIsUploadingImage(true);
    let publicImageUrl: string | undefined = undefined;

    try {
      if (selectedPhoto) {
        // Upload image to Supabase Storage
        const bytes = await uriToUint8Array(selectedPhoto);
        const path = `${userId}/journal/entry-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(path, bytes, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
        publicImageUrl = data.publicUrl;
      }

      await createEntry.mutateAsync({
        coupleId,
        creatorId: userId,
        title: title.trim(),
        content: content.trim(),
        imageUrl: publicImageUrl,
        voiceUrl: voiceUrl || undefined,
        voiceDuration: voiceDuration || undefined,
        mood: selectedMood || undefined,
      });
      router.replace('/journal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save your journal entry.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const isPending = createEntry.isPending || isUploadingImage;

  const MOODS = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
    { emoji: '💖', label: 'Nostalgic', value: 'nostalgic' },
    { emoji: '🥰', label: 'Intimate', value: 'intimate' },
    { emoji: '😔', label: 'Moody', value: 'moody' },
  ];

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity className="self-start py-2 mt-2 mb-2" onPress={() => router.back()}>
              <Text style={{ color: theme.accent }} className="text-sm font-semibold">← Back</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-text-primary mb-1" style={{ color: theme.textPrimary }}>New Memory</Text>
            <Text className="text-sm text-text-secondary mb-6 leading-relaxed" style={{ color: theme.textSecondary }}>
              Capture a special moment, milestone, or reflection together.
            </Text>

            <Card glass className="flex-1 p-6 gap-4 border shadow-md">
              {/* Title Input */}
              <Input
                label="Title"
                placeholder="Give this moment a name..."
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />

              {/* Mood Selector Row */}
              <View className="mb-2">
                <Text className="text-xs font-semibold text-text-secondary mb-2" style={{ color: theme.textSecondary }}>
                  How are you feeling about this memory?
                </Text>
                <View className="flex-row justify-between">
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m.value;
                    return (
                      <TouchableOpacity
                        key={m.value}
                        onPress={() => setSelectedMood(m.value)}
                        className="items-center justify-center p-2.5 rounded-2xl border flex-1 mx-1"
                        style={{
                          borderColor: isSelected ? theme.accent : 'rgba(229, 231, 235, 0.5)',
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(79, 70, 229, 0.05)'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <Text className="text-xl mb-0.5">{m.emoji}</Text>
                        <Text className="text-[9px] font-bold" style={{ color: isSelected ? theme.textPrimary : theme.textSecondary }}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Memory Details Input */}
              <Input
                label="Memory Details"
                placeholder="What happened? How did it feel? Write down the details..."
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                className="h-32 text-left py-3.5"
              />

              {/* Real Polaroid Scrapbook Image Selector */}
              <View>
                <Text className="text-xs font-semibold text-text-secondary mb-2" style={{ color: theme.textSecondary }}>
                  📸 Attach Memory Picture (Optional)
                </Text>
                {selectedPhoto ? (
                  <View className="relative w-36 h-36 rounded-2xl overflow-hidden border border-neutral-border bg-slate-50">
                    <Image source={{ uri: selectedPhoto }} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => setSelectedPhoto(null)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-950/60 rounded-full items-center justify-center active:bg-slate-950/80"
                    >
                      <Text className="text-white text-xs font-bold mt-[-2px]">✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="w-full h-20 rounded-2xl border border-dashed justify-center items-center active:bg-indigo-50/10"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Text className="text-2xl mb-0.5">📷</Text>
                    <Text className="text-[10px] text-text-secondary font-bold" style={{ color: theme.textSecondary }}>
                      Add Picture
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* VoiceNoteRecorder Integration */}
              <View className="mt-2">
                {voiceUrl ? (
                  <View className="flex-row items-center justify-between border rounded-2xl p-3" style={{ borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.4)' }}>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base">🎙️</Text>
                      <View>
                        <Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>Voice Capsule Attached</Text>
                        <Text className="text-3xs mt-0.5" style={{ color: theme.textTertiary }}>Ready to be locked into memory</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setVoiceUrl(null);
                        setVoiceDuration(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 active:bg-red-500/20"
                    >
                      <Text className="text-red-500 text-3xs font-bold">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <VoiceNoteRecorder
                    userId={user?.id}
                    onUploaded={(url, secs) => {
                      setVoiceUrl(url);
                      setVoiceDuration(secs);
                    }}
                  />
                )}
              </View>

              <Button
                title="Save to Journal"
                onPress={handleSubmit}
                disabled={!title.trim() || !content.trim() || isPending}
                loading={isPending}
                className="w-full mt-2"
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}
