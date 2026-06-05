import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useUserProfile, useUpdateProfile, usePairPartner } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';
import { ScreenShell } from '../../../components/ScreenShell';

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
  const [customCode, setCustomCode] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isCustomSaving, setIsCustomSaving] = useState(false);

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

  const handleCopyCode = async () => {
    if (profile?.invite_code) {
      await Clipboard.setStringAsync(profile.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  };

  const handleSaveCustomCode = async () => {
    const formattedCode = customCode.trim().toUpperCase();
    if (formattedCode.length < 3 || formattedCode.length > 10) {
      Alert.alert('Invalid Code', 'Custom code must be between 3 and 10 characters.');
      return;
    }
    if (!user) return;

    setIsCustomSaving(true);
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        invite_code: formattedCode,
      });
      Alert.alert('Custom Code Saved!', `Your invite code has been updated to "${formattedCode}".`);
      setShowCustomForm(false);
      setCustomCode('');
    } catch (err: any) {
      if (err.message && (err.message.includes('unique') || err.message.includes('duplicate') || err.message.includes('already exists'))) {
        Alert.alert('Code Taken', 'This invite code is already in use by another user. Please try another one.');
      } else {
        Alert.alert('Error', err.message || 'Could not update invite code.');
      }
    } finally {
      setIsCustomSaving(false);
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
      <ScreenShell className="flex-1">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4 pt-4 pb-6 justify-between">
            <View className="mb-6 items-center">
              <Skeleton width={200} height={28} className="mb-3" />
              <Skeleton width={280} height={16} className="mb-1" />
              <Skeleton width={240} height={16} />
            </View>
            <View className="flex-1 justify-center gap-6 my-4">
              <View className="bg-white/60 rounded-2xl p-5 border border-neutral-border/10 shadow-sm items-center">
                <Skeleton width={120} height={16} className="mb-3" />
                <Skeleton width="100%" height={60} className="mb-3" />
                <Skeleton width="80%" height={14} />
              </View>
              <View className="bg-white/60 rounded-2xl p-5 border border-neutral-border/10 shadow-sm items-center">
                <Skeleton width={140} height={16} className="mb-3" />
                <Skeleton width="100%" height={48} className="mb-3" />
                <Skeleton width="100%" height={48} />
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-2 px-2">
              <Skeleton width={60} height={24} />
              <Skeleton width={100} height={24} />
            </View>
          </View>
        </SafeAreaView>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, justifyContent: 'space-between' }} showsVerticalScrollIndicator={false}>
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
                className="w-full bg-primary-100/50 border border-primary-100/20 py-3.5 rounded-xl items-center mb-3 active:bg-blue-200"
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Text className="text-3xl font-bold text-primary-600 tracking-[4px]">{profile?.invite_code || '------'}</Text>
                <Text className="text-2xs text-primary-600 font-medium mt-1">Tap to Copy</Text>
              </TouchableOpacity>

              {showCustomForm ? (
                <View className="w-full mt-2 border-t border-slate-100 pt-3 items-center">
                  <Input
                    placeholder="Custom code (3-10 chars)"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={10}
                    value={customCode}
                    onChangeText={(val) => setCustomCode(val.replace(/[^A-Za-z0-9]/g, ''))}
                    className="text-center font-bold text-base tracking-[2px] bg-background/50 w-full"
                  />
                  <View className="flex-row gap-2 mt-2 w-full">
                    <TouchableOpacity
                      className="flex-1 bg-slate-100 h-11 rounded-xl items-center justify-center active:bg-slate-200"
                      onPress={() => {
                        setShowCustomForm(false);
                        setCustomCode('');
                      }}
                      disabled={isCustomSaving}
                    >
                      <Text className="text-xs text-text-secondary font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-[2] bg-primary-600 h-11 rounded-xl items-center justify-center active:bg-primary-700"
                      onPress={handleSaveCustomCode}
                      disabled={isCustomSaving || customCode.trim().length < 3}
                    >
                      <Text className="text-xs text-white font-semibold">
                        {isCustomSaving ? 'Saving...' : 'Save Custom Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setCustomCode(profile?.invite_code || '');
                    setShowCustomForm(true);
                  }}
                  className="mt-1 py-1"
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-semibold text-primary-600 underline">Customize Your Code</Text>
                </TouchableOpacity>
              )}

              <Text className="text-xs text-text-secondary text-center leading-relaxed px-4 mt-3.5">
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
                className="text-center font-bold text-lg tracking-[2px] bg-background/50"
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
      </SafeAreaView>
    </ScreenShell>
  );
}
