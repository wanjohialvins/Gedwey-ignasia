import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import { uriToBlob } from '../lib/fileUtils';

type Props = {
  userId?: string;
  bucket?: string;
  onUploaded: (url: string, seconds: number) => void;
};

export const VoiceNoteRecorder = ({ userId, bucket = 'voice-notes', onUploaded }: Props) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Needed', 'Enable microphone access to record a voice note.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: nextRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => setSeconds(Math.round((status.durationMillis ?? 0) / 1000)),
        500
      );
      setRecording(nextRecording);
      setSeconds(0);
    } catch (error: any) {
      Alert.alert('Recording Failed', error.message || 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) setLocalUri(uri);
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  };

  const playPreview = async () => {
    if (!localUri) return;
    if (sound) {
      await sound.replayAsync();
      return;
    }
    const { sound: nextSound } = await Audio.Sound.createAsync({ uri: localUri });
    setSound(nextSound);
    await nextSound.playAsync();
  };

  const upload = async () => {
    if (!localUri || !userId) return;
    setIsUploading(true);
    try {
      const blob = await uriToBlob(localUri);
      const path = `${userId}/${Date.now()}.m4a`;
      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType: 'audio/m4a',
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onUploaded(data.publicUrl, seconds);
      Alert.alert('Voice Note Ready', 'Your voice response is attached.');
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Could not upload voice note.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-sm font-bold text-text-primary">Voice note</Text>
          <Text className="text-xs text-text-secondary">Record instead of typing.</Text>
        </View>
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          className={`h-11 px-4 rounded-xl items-center justify-center ${recording ? 'bg-red-500' : 'bg-primary-600'}`}
        >
          <Text className="text-white font-bold text-sm">{recording ? 'Stop' : 'Record'}</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-end gap-1 h-9 mb-3">
        {[8, 18, 12, 27, 16, 30, 14, 22, 10, 25, 15, 20].map((height, index) => (
          <View
            key={`${height}-${index}`}
            className={`w-2 rounded-full ${recording ? 'bg-primary-600' : 'bg-blue-200'}`}
            style={{ height }}
          />
        ))}
        <Text className="text-xs font-semibold text-text-secondary ml-2">{seconds}s</Text>
      </View>

      {localUri ? (
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={playPreview} className="flex-1 bg-white border border-blue-100 rounded-xl py-3 items-center">
            <Text className="text-xs font-bold text-primary-600">Play preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={upload}
            disabled={isUploading || !userId}
            className="flex-1 bg-primary-600 rounded-xl py-3 items-center"
          >
            <Text className="text-xs font-bold text-white">{isUploading ? 'Uploading...' : 'Attach note'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};
