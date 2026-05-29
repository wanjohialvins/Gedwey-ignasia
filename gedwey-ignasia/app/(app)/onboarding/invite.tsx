import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile, useUpdateProfile, usePairPartner } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';

// Function to generate a random 6-character uppercase alphanumeric code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function InviteScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useUserProfile(user?.id ?? '');
  const updateProfile = useUpdateProfile();
  const pairPartner = usePairPartner();
  const [partnerCode, setPartnerCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate and save invite code if one doesn't exist
  useEffect(() => {
    if (isLoading || !profile || !user) return;

    if (!profile.invite_code && !updateProfile.isPending && !isGenerating) {
      setIsGenerating(true);
      const code = generateInviteCode();
      updateProfile.mutate(
        { id: user.id, invite_code: code },
        {
          onSettled: () => {
            setIsGenerating(false);
          },
          onError: () => {
            // Retry once on failure
            const retryCode = generateInviteCode();
            updateProfile.mutate({ id: user.id, invite_code: retryCode });
          },
        }
      );
    }
  }, [profile, isLoading, user]);

  const handleCopyCode = () => {
    if (profile?.invite_code) {
      Clipboard.setString(profile.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  };

  const handlePair = async () => {
    const formattedCode = partnerCode.trim().toUpperCase();
    if (!formattedCode) {
      Alert.alert('Empty Code', 'Please enter your partner\'s invite code.');
      return;
    }
    if (formattedCode === profile?.invite_code) {
      Alert.alert('Invalid Code', 'You cannot enter your own invite code.');
      return;
    }
    if (!user) return;

    try {
      const result = await pairPartner.mutateAsync({
        partnerCode: formattedCode,
        userId: user.id,
      });

      if (result.success) {
        Alert.alert(
          'Successfully Paired!',
          `You are now connected with ${result.partner_display_name || 'your partner'}!`,
          [{ text: 'Great!', onPress: () => router.replace('/') }]
        );
      }
    } catch (err: any) {
      Alert.alert('Pairing Failed', err.message || 'Could not pair with the entered code.');
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  if (isLoading || isGenerating) {
    return (
      <View className="flex-1 bg-background px-4 pt-16 pb-6 justify-between">
        <View className="mb-6 items-center">
          <Skeleton width={200} height={28} className="mb-3" />
          <Skeleton width={280} height={16} className="mb-1" />
          <Skeleton width={240} height={16} />
        </View>
        <View className="flex-1 justify-center gap-6 my-4">
          <View className="bg-white rounded-2xl p-5 border border-neutral-border shadow-sm items-center">
            <Skeleton width={120} height={16} className="mb-3" />
            <Skeleton width="100%" height={60} className="mb-3" />
            <Skeleton width="80%" height={14} />
          </View>
          <View className="bg-white rounded-2xl p-5 border border-neutral-border shadow-sm items-center">
            <Skeleton width={140} height={16} className="mb-3" />
            <Skeleton width="100%" height={48} className="mb-3" />
            <Skeleton width="100%" height={48} />
          </View>
        </View>
        <View className="flex-row justify-between items-center mt-2">
          <Skeleton width={60} height={24} />
          <Skeleton width={100} height={24} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 64, paddingBottom: 24, justifyContent: 'space-between' }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary text-center mb-2">Connect with Partner</Text>
          <Text className="text-sm text-text-secondary text-center px-4 leading-relaxed">
            Share moments, compare daily moods, and grow closer by pairing your accounts.
          </Text>
        </View>

        {/* Your Code Section */}
        <Card className="p-5 mb-5 items-center">
          <Text className="text-base font-semibold text-text-primary mb-3">Your Invite Code</Text>
          <TouchableOpacity
            className="w-full bg-primary-100 border border-primary-100 py-3.5 rounded-xl items-center mb-3 active:bg-blue-200"
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text className="text-3xl font-bold text-primary-600 tracking-[4px]">{profile?.invite_code || '------'}</Text>
            <Text className="text-2xs text-primary-600 font-medium mt-1">Tap to Copy</Text>
          </TouchableOpacity>
          <Text className="text-xs text-text-secondary text-center leading-relaxed px-4">
            Give this code to your partner so they can enter it on their device.
          </Text>
        </Card>

        {/* Partner Code Section */}
        <Card className="p-5 mb-5">
          <Text className="text-base font-semibold text-text-primary text-center mb-3">Enter Partner Code</Text>
          <Input
            placeholder="e.g. X87G2K"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            value={partnerCode}
            onChangeText={setPartnerCode}
            className="text-center font-bold text-lg tracking-[2px] bg-background"
          />
          <Button
            title="Pair & Connect"
            onPress={handlePair}
            disabled={pairPartner.isPending}
            loading={pairPartner.isPending}
            className="w-full"
          />
        </Card>

        {/* Skip / Back Actions */}
        <View className="flex-row justify-between items-center mt-2 px-2">
          <TouchableOpacity
            className="py-3"
            onPress={() => router.back()}
            disabled={pairPartner.isPending}
          >
            <Text className="text-text-secondary text-sm font-semibold">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3"
            onPress={handleSkip}
            disabled={pairPartner.isPending}
          >
            <Text className="text-primary-600 text-sm font-semibold">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
