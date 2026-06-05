import React, { useState, useEffect } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateJournalEntry } from '../../../lib/queries/journal';
import { useSessionSoundscape } from '../../../lib/hooks/useSessionSoundscape';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { supabase } from '../../../lib/supabase';
import { uriToUint8Array } from '../../../lib/fileUtils';

export default function JournalCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const { data: profile } = useUserProfile(user?.id ?? '');
  const createEntry = useCreateJournalEntry();
  useSessionSoundscape(profile);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Custom States
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Reanimated Waveform Scale Values
  const micPulse = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      // Pulse animation loop
      micPulse.value = withRepeat(withTiming(1.15, { duration: 500 }), -1, true);
      ringScale.value = withRepeat(withTiming(1.6, { duration: 1000 }), -1, false);
      ringOpacity.value = withRepeat(withTiming(0, { duration: 1000 }), -1, false);

      timer = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 30) {
            handleStopRecording(true);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      micPulse.value = withTiming(1, { duration: 200 });
      ringScale.value = 1;
      ringOpacity.value = 0;
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    setVoiceDuration(null);
    setRecordSeconds(0);
    setIsRecording(true);
  };

  const handleStopRecording = (save = true) => {
    setIsRecording(false);
    if (save && recordSeconds > 0) {
      const formattedDuration = `00:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`;
      setVoiceDuration(formattedDuration);
    }
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

    // Embed mock voice note tag into content body if recorded
    let finalContent = content.trim();
    if (voiceDuration) {
      finalContent += `\n\n[voice:${voiceDuration}]`;
    }

    setIsUploadingImage(true);
    let publicImageUrl: string | undefined = undefined;

    try {
      if (selectedPhoto) {
        // Upload real image to Supabase Storage
        const bytes = await uriToUint8Array(selectedPhoto);
        const path = `journal/${userId}/entry-${Date.now()}.jpg`;
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
        content: finalContent,
        imageUrl: publicImageUrl,
      });
      router.replace('/journal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save your journal entry.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const isPending = createEntry.isPending || isUploadingImage;

  // Animated Styles
  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const formatTimer = (seconds: number) => {
    return `00:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              className="h-32 text-left py-3.5"
            />

            {/* Real Polaroid Scrapbook Image Selector */}
            <View>
              <Text className="text-xs font-semibold text-text-secondary mb-2">📸 Attach Memory Picture (Optional)</Text>
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
                  className="w-36 h-36 rounded-2xl border border-dashed border-indigo-200 bg-white justify-center items-center active:bg-indigo-50/10"
                >
                  <Text className="text-3xl mb-1">📷</Text>
                  <Text className="text-[10px] text-text-secondary font-bold">Add Picture</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Premium Visual Microphone Soundwave Mock Recorder */}
            <Card className="p-4 border border-pink-100 bg-pink-50/15">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-bold text-pink-600">🎙️ Record Voice Capsule (Optional)</Text>
                {voiceDuration && (
                  <TouchableOpacity
                    onPress={() => setVoiceDuration(null)}
                    className="bg-red-50 border border-red-100 px-2 py-0.5 rounded-md"
                  >
                    <Text className="text-3xs font-bold text-red-500">Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isRecording ? (
                /* Recording Mode View */
                <View className="items-center py-4">
                  {/* Waveform rings */}
                  <View className="relative w-20 h-20 items-center justify-center mb-3">
                    <Animated.View
                      className="absolute w-16 h-16 bg-pink-300 rounded-full"
                      style={ringAnimatedStyle}
                    />
                    <TouchableOpacity
                      onPress={() => handleStopRecording(true)}
                      className="w-16 h-16 bg-pink-500 rounded-full items-center justify-center z-10 shadow-md"
                    >
                      <Text className="text-white text-lg font-bold">⏹️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs font-bold text-pink-600 animate-pulse">
                    Recording... {formatTimer(recordSeconds)}
                  </Text>
                  <Text className="text-[10px] text-text-secondary mt-1">Tap stop button when finished</Text>
                </View>
              ) : voiceDuration ? (
                /* Recording Saved View */
                <View className="flex-row items-center justify-between bg-white border border-pink-100 rounded-xl p-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">🎙️</Text>
                    <View>
                      <Text className="text-xs font-semibold text-text-primary">Voice Capsule Attached</Text>
                      <Text className="text-3xs text-text-muted mt-0.5">Ready to be locked into memory</Text>
                    </View>
                  </View>
                  <View className="bg-pink-100 px-2.5 py-1 rounded-md">
                    <Text className="text-2xs font-bold text-pink-600">{voiceDuration}</Text>
                  </View>
                </View>
              ) : (
                /* Recording Empty Start View */
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-xs text-text-secondary leading-normal">
                      Attach a short 10-30s private audio recording to play back anytime in this memory.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleStartRecording}
                    className="bg-pink-500 w-11 h-11 rounded-full items-center justify-center active:bg-pink-400 shadow-md"
                  >
                    <Text className="text-white text-base">🎙️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            <Button
              title="Save to Journal"
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || isPending || isRecording}
              loading={isPending}
              className="w-full mt-2 mb-6"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
