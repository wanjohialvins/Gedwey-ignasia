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
import { useCreateTimeCapsule } from '../../../lib/queries/capsules';
import { scheduleLocalNotification, NOTIFICATION_CHANNELS } from '../../../lib/notifications';
import { userWantsCapsuleNotifications } from '../../../lib/notificationPrefs';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';

interface Timeframe {
  label: string;
  sublabel: string;
  days: number;
}

const TIMEFRAMES: Timeframe[] = [
  { label: '1 Week', sublabel: 'Quick surprise', days: 7 },
  { label: '1 Month', sublabel: 'A reflection of today', days: 30 },
  { label: '3 Months', sublabel: 'Season change', days: 90 },
  { label: '6 Months', sublabel: 'Half a year perspective', days: 180 },
  { label: '1 Year', sublabel: 'Our anniversary', days: 365 },
];

export default function CapsuleCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile } = useUserProfile(user?.id ?? '');
  const createCapsule = useCreateTimeCapsule();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your time capsule.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Message Required', 'Please write a message to seal inside.');
      return;
    }

    let daysToLock = 0;
    if (isCustom) {
      const parsedDays = parseInt(customDays, 10);
      if (isNaN(parsedDays) || parsedDays <= 0) {
        Alert.alert('Invalid Days', 'Please enter a valid number of days greater than 0.');
        return;
      }
      daysToLock = parsedDays;
    } else {
      if (!selectedTimeframe) {
        Alert.alert('Timeframe Required', 'Please select when this capsule should unlock.');
        return;
      }
      daysToLock = selectedTimeframe.days;
    }

    const coupleId = profile?.couple_id;
    const creatorId = user?.id;

    if (!coupleId || !creatorId) {
      Alert.alert('Error', 'Unable to resolve couple identity. Ensure you are paired.');
      return;
    }

    // Calculate open date
    const openDate = new Date();
    openDate.setDate(openDate.getDate() + daysToLock);

    try {
      const result = await createCapsule.mutateAsync({
        coupleId,
        creatorId,
        title: title.trim(),
        content: content.trim(),
        openDate: openDate.toISOString(),
      });

      // Calculate delay in seconds and schedule local notification
      const delaySeconds = Math.floor((openDate.getTime() - Date.now()) / 1000);
      if (delaySeconds > 0 && userWantsCapsuleNotifications(profile)) {
        await scheduleLocalNotification(
          'Time Capsule Unlocked! ⏳',
          `Your time capsule "${title.trim()}" is ready to be opened.`,
          delaySeconds,
          {
            identifier: result.id,
            channelId: NOTIFICATION_CHANNELS.capsules,
            data: { type: 'capsule_ready', capsuleId: result.id },
          }
        );
      }

      router.replace('/capsule');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not seal your time capsule.');
    }
  };

  const isPending = createCapsule.isPending;

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

          <Text className="text-2xl font-bold text-text-primary">Seal a Capsule</Text>
          <Text className="text-sm text-text-secondary mt-1 mb-6 leading-relaxed">
            Lock a letter or photo reference. Neither of you will be able to read it until the countdown ends.
          </Text>

          <View className="flex-1 gap-4">
            {/* Title */}
            <Input
              label="Capsule Title"
              placeholder="E.g., Read this on our anniversary..."
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Content */}
            <Input
              label="Sealed Message"
              placeholder="Write your letter to the future..."
              multiline
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              className="h-32 text-left py-3.5"
            />

            {/* Timeframe selector */}
            <View className="mb-2">
              <Text className="text-sm font-medium text-text-secondary mb-2">Seal Duration</Text>
              
              <View className="flex-row flex-wrap gap-2.5">
                {TIMEFRAMES.map((tf) => {
                  const isSelected = !isCustom && selectedTimeframe?.days === tf.days;
                  return (
                    <TouchableOpacity
                      key={tf.days}
                      style={{ borderWidth: isSelected ? 2 : 1 }}
                      className={`flex-1 min-w-[140px] bg-white rounded-xl p-3 justify-center ${
                        isSelected ? 'border-primary-600 bg-primary-100/50' : 'border-neutral-border'
                      }`}
                      onPress={() => {
                        setIsCustom(false);
                        setSelectedTimeframe(tf);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text 
                        className={`text-sm font-semibold mb-0.5 ${
                          isSelected ? 'text-primary-600' : 'text-slate-700'
                        }`}
                      >
                        {tf.label}
                      </Text>
                      <Text className="text-[10px] text-text-muted">{tf.sublabel}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={{ borderWidth: isCustom ? 2 : 1 }}
                  className={`flex-1 min-w-[140px] bg-white rounded-xl p-3 justify-center ${
                    isCustom ? 'border-primary-600 bg-primary-100/50' : 'border-neutral-border'
                  }`}
                  onPress={() => {
                    setIsCustom(true);
                    setSelectedTimeframe(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text 
                    className={`text-sm font-semibold mb-0.5 ${
                      isCustom ? 'text-primary-600' : 'text-slate-700'
                    }`}
                  >
                    Custom
                  </Text>
                  <Text className="text-[10px] text-text-muted">Specify days offset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Days offset input */}
            {isCustom && (
              <Input
                label="Number of days to seal"
                placeholder="E.g., 45"
                keyboardType="numeric"
                value={customDays}
                onChangeText={setCustomDays}
              />
            )}

            <Button
              title="Seal in Time Vault"
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || (!selectedTimeframe && !isCustom) || isPending}
              loading={isPending}
              className="w-full mt-2 mb-6"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
