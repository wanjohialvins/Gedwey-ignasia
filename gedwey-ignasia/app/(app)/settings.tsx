import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { uriToBlob } from '../../lib/fileUtils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import {
  useUserProfile,
  useUpdateProfile,
  usePairPartner,
  useUnpairPartner,
} from '../../lib/queries/profile';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { BottomNav } from '../../components/BottomNav';
import { DevBadge } from '../../components/DevBadge';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { getUserPreferences } from '../../lib/notificationPrefs';
import { playSoundscape, stopSoundscape } from '../../lib/soundscapePlayer';
import { SOUNDSCAPE_TRACKS } from '../../lib/soundscapes';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // 1. Fetch Profiles via React Query
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(user?.id ?? '');
  const { data: partnerProfile, isLoading: isPartnerLoading } = useUserProfile(
    profile?.partner_id ?? ''
  );

  // 2. Mutations
  const updateProfile = useUpdateProfile();
  const pairPartner = usePairPartner();
  const unpairPartner = useUnpairPartner();

  // 3. Component States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loveLanguage, setLoveLanguage] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [stage, setStage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<'default' | 'dark' | 'soft'>('default');
  const [matureModeEnabled, setMatureModeEnabled] = useState(false);
  const [sessionNotif, setSessionNotif] = useState(true);
  const [partnerNotif, setPartnerNotif] = useState(true);
  const [capsuleNotif, setCapsuleNotif] = useState(true);

  // Premium Roadmap States
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'dark' | 'soft'>('default');
  const [soundscapeEnabled, setSoundscapeEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState('acoustic');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);

  // Customizable Invite Code States
  const [customCode, setCustomCode] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isCustomSaving, setIsCustomSaving] = useState(false);

  // Sync profile data to local state on load
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLoveLanguage(profile.love_language || '');
      setStage(profile.relationship_stage || 'discovery');
      setAvatarUrl(profile.avatar_url || null);
      setThemePreference(profile.theme_preference || 'default');
      setSelectedTheme(profile.theme_preference || 'default');
      setMatureModeEnabled(!!profile.mature_mode_enabled);

      const prefs = getUserPreferences(profile);
      setSessionNotif(prefs.sessionNotif !== false);
      setPartnerNotif(prefs.partnerNotif !== false);
      setCapsuleNotif(prefs.capsuleNotif !== false);
      setSoundscapeEnabled(!!prefs.soundscapeEnabled);
      setSelectedSound(prefs.selectedSound || 'acoustic');
    }
  }, [profile]);

  useEffect(() => {
    if (soundscapeEnabled) {
      playSoundscape(selectedSound).catch(() => {});
    } else {
      stopSoundscape().catch(() => {});
    }
    return () => {
      stopSoundscape().catch(() => {});
    };
  }, [soundscapeEnabled, selectedSound]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }
    if (!user) return;

    setIsSavingProfile(true);
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        love_language: loveLanguage || null,
        relationship_stage: stage,
        avatar_url: avatarUrl,
        theme_preference: selectedTheme,
        mature_mode_enabled: matureModeEnabled,
        mature_mode_age_verified: matureModeEnabled,
        preferences: {
          sessionNotif,
          partnerNotif,
          capsuleNotif,
          soundscapeEnabled,
          selectedSound,
        },
      });
      Alert.alert('Profile Saved', 'Your profile details have been successfully updated.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!user) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo Access Needed', 'Enable photo library access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    try {
      const asset = result.assets[0];
      const blob = await uriToBlob(asset.uri);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('profile-images').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await updateProfile.mutateAsync({ id: user.id, avatar_url: data.publicUrl });
      Alert.alert('Profile Picture Updated', 'Your new photo is saved.');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload profile picture.');
    }
  };

  // Helper to generate a random 6-character uppercase alphanumeric code
  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCopyCode = async () => {
    if (profile?.invite_code) {
      await Clipboard.setStringAsync(profile.invite_code);
      Alert.alert('Code Copied!', 'Your invite code is copied. Send it to your partner to link.');
    }
  };

  const handleGenerateRandomCode = async () => {
    if (!user) return;
    try {
      const code = generateInviteCode();
      await updateProfile.mutateAsync({
        id: user.id,
        invite_code: code,
      });
      Alert.alert('Code Generated!', `Your new invite code is "${code}".`);
    } catch (err: any) {
      Alert.alert('Generation Failed', err.message || 'Could not generate invite code.');
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
    if (!partnerCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid invite code.');
      return;
    }
    if (!user) return;

    setIsPairing(true);
    try {
      await pairPartner.mutateAsync({
        partnerCode: partnerCode.trim(),
        userId: user.id,
      });
      Alert.alert('Paired Successfully!', 'You are now connected with your partner.');
      setPartnerCode('');
    } catch (err: any) {
      Alert.alert('Pairing Failed', err.message || 'Could not link with that invite code.');
    } finally {
      setIsPairing(false);
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      'Disconnect Partner? ⚠️',
      'Are you sure you want to disconnect? This will unpair you and your partner. You will lose access to shared spaces like the Journal and Time Capsules.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            if (!user || !profile) return;
            setIsUnpairing(true);
            try {
              await unpairPartner.mutateAsync({
                userId: user.id,
                partnerId: profile.partner_id || '',
              });
              Alert.alert('Unpaired', 'You are no longer linked to your partner.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to disconnect.');
            } finally {
              setIsUnpairing(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account? 🚨',
      'This action is permanent and cannot be undone. All your profile information and sessions will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Feature coming soon', 'Account deletion must be executed via the user portal.');
          },
        },
      ]
    );
  };

  const isPaired = !!profile?.couple_id;
  const isLoading = isProfileLoading || (isPaired && isPartnerLoading);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-4 pt-16">
        <View className="flex-row items-center mb-6">
          <Skeleton width={80} height={20} className="mr-4" />
          <Skeleton width={150} height={28} />
        </View>
        <Card className="p-5 mb-5">
          <Skeleton width={120} height={20} className="mb-4" />
          <Skeleton width="100%" height={44} className="mb-3 rounded-xl" />
          <Skeleton width="100%" height={44} className="rounded-xl" />
        </Card>
        <Card className="p-5 mb-5">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton width="100%" height={80} className="rounded-xl" />
        </Card>
      </View>
    );
  }

  return (
    <ScreenShell className="flex-1">
    <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 112 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity
          className="bg-primary-100 px-3 py-1.5 rounded-lg active:opacity-70"
          onPress={() => router.back()}
        >
          <Text className="text-sm font-semibold text-primary-600">← Back</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <AppIcon name={NAV_ICONS.profileActive} size={22} color="#4F46E5" />
          <Text className="text-xl font-bold text-text-primary">Profile</Text>
          <DevBadge />
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Profile Section */}
      <Card className="p-5 mb-5">
        <Text className="text-base font-semibold text-text-primary mb-4">Profile Settings</Text>
        <View className="items-center mb-4">
          <TouchableOpacity onPress={handlePickAvatar} className="items-center">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full mb-2" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-2">
                <Text className="text-2xl font-bold text-primary-600">
                  {(displayName || user?.email || 'G').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text className="text-xs font-bold text-primary-600">Upload profile picture</Text>
          </TouchableOpacity>
        </View>
        <Input
          label="Your Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter display name"
        />

        <Input
          label="About Me (optional)"
          value={bio}
          onChangeText={setBio}
          placeholder="A short bio — max 150 characters"
          maxLength={150}
        />

        <Text className="text-xs font-semibold text-text-secondary mt-3 mb-1">Love Language</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {[
            'Words of Affirmation',
            'Acts of Service',
            'Receiving Gifts',
            'Quality Time',
            'Physical Touch',
          ].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setLoveLanguage(option)}
              className={`px-3 py-2 rounded-xl border ${loveLanguage === option ? 'bg-primary-100 border-primary-600' : 'bg-white border-neutral-border'}`}
            >
              <Text className={`text-[10px] font-semibold ${loveLanguage === option ? 'text-primary-600' : 'text-text-secondary'}`}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-xs font-semibold text-text-secondary mt-3 mb-1">Relationship Stage</Text>
        <View className="flex-row gap-2 mt-1 mb-4">
          {['discovery', 'early_dating', 'couples'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStage(s)}
              className={`flex-1 py-2.5 rounded-xl border items-center capitalize ${
                stage === s
                  ? 'bg-primary-100 border-primary-600'
                  : 'bg-white border-neutral-border'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  stage === s ? 'text-primary-600' : 'text-text-secondary'
                }`}
              >
                {s.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isPaired && partnerProfile ? (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-text-secondary mb-2">Partner Profile</Text>
            <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <Text className="text-sm font-bold text-text-primary capitalize">{partnerProfile.display_name || 'Partner'}</Text>
              {partnerProfile.love_language ? (
                <Text className="text-xs text-primary-600 mt-1">{partnerProfile.love_language}</Text>
              ) : null}
              {partnerProfile.bio ? (
                <Text className="text-xs text-text-secondary mt-2 leading-normal">{partnerProfile.bio}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <Button
          title="Save Details"
          onPress={handleSaveProfile}
          loading={isSavingProfile}
          className="mt-2 w-full"
        />
      </Card>

      {/* Connection & Pairing Section */}
      <Card className="p-5 mb-5">
        <Text className="text-base font-semibold text-text-primary mb-4">Connection & Pairing</Text>
        
        {isPaired ? (
          <View className="gap-3">
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">❤️</Text>
                <View>
                  <Text className="text-xs text-text-secondary">Paired Partner</Text>
                  <Text className="text-sm font-semibold text-text-primary capitalize">
                    {partnerProfile?.display_name || 'Your Partner'}
                  </Text>
                </View>
              </View>
              <View className="bg-primary-600 px-2 py-1 rounded-md">
                <Text className="text-2xs font-bold text-white">Active</Text>
              </View>
            </View>

            <Button
              title="Disconnect Partner"
              onPress={handleUnpair}
              loading={isUnpairing}
              variant="secondary"
              className="border border-red-200 bg-red-50 text-red-600 mt-2"
            />
          </View>
        ) : (
          <View className="gap-4">
            <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <Text className="text-xs text-text-secondary mb-1">Your Copiable Invite Code</Text>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-lg font-bold text-primary-600 tracking-wider">
                  {profile?.invite_code || '—'}
                </Text>
                {profile?.invite_code && (
                  <TouchableOpacity
                    onPress={handleCopyCode}
                    className="bg-primary-100 px-3 py-1.5 rounded-lg active:opacity-75"
                  >
                    <Text className="text-2xs font-bold text-primary-600">Copy Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {showCustomForm ? (
                <View className="w-full mt-3 border-t border-slate-200/50 pt-3">
                  <Input
                    placeholder="Custom code (3-10 chars)"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={10}
                    value={customCode}
                    onChangeText={(val) => setCustomCode(val.replace(/[^A-Za-z0-9]/g, ''))}
                  />
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      className="flex-1 bg-slate-100 h-10 rounded-xl items-center justify-center active:bg-slate-200"
                      onPress={() => {
                        setShowCustomForm(false);
                        setCustomCode('');
                      }}
                      disabled={isCustomSaving}
                    >
                      <Text className="text-xs text-text-secondary font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-[2] bg-primary-600 h-10 rounded-xl items-center justify-center active:bg-primary-700"
                      onPress={handleSaveCustomCode}
                      disabled={isCustomSaving || customCode.trim().length < 3}
                    >
                      <Text className="text-xs text-white font-semibold">
                        {isCustomSaving ? 'Saving...' : 'Save Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="flex-row gap-3 mt-3 border-t border-slate-100 pt-3">
                  <TouchableOpacity
                    onPress={() => {
                      setCustomCode(profile?.invite_code || '');
                      setShowCustomForm(true);
                    }}
                    className="flex-1 items-center justify-center py-2.5 bg-slate-100 rounded-xl active:bg-slate-200"
                  >
                    <Text className="text-xs font-semibold text-text-secondary">
                      {profile?.invite_code ? 'Customize Code' : 'Set Custom Code'}
                    </Text>
                  </TouchableOpacity>
                  {!profile?.invite_code && (
                    <TouchableOpacity
                      onPress={handleGenerateRandomCode}
                      className="flex-1 items-center justify-center py-2.5 bg-primary-100 rounded-xl active:bg-blue-200"
                    >
                      <Text className="text-xs font-semibold text-primary-600">Generate Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View className="border-t border-slate-100 pt-3">
              <Input
                label="Pair with a Partner"
                placeholder="Enter partner's code"
                value={partnerCode}
                onChangeText={setPartnerCode}
              />
              <Button
                title="Connect Partner"
                onPress={handlePair}
                loading={isPairing}
                className="mt-3 w-full"
              />
            </View>
          </View>
        )}
      </Card>

      {/* Preferences Section */}
      <Card className="p-5 mb-5">
        <Text className="text-base font-semibold text-text-primary mb-4">Notification Preferences</Text>
        
        <View className="flex-row justify-between items-center py-2.5 border-b border-slate-100">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-medium text-text-primary">Daily Sessions</Text>
            <Text className="text-2xs text-text-secondary mt-0.5">Receive reminders for new daily cards</Text>
          </View>
          <Switch
            value={sessionNotif}
            onValueChange={setSessionNotif}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={sessionNotif ? '#2563EB' : '#F1F5F9'}
          />
        </View>

        <View className="flex-row justify-between items-center py-2.5 border-b border-slate-100">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-medium text-text-primary">Partner Responses</Text>
            <Text className="text-2xs text-text-secondary mt-0.5">Get notified when partner reveals answers</Text>
          </View>
          <Switch
            value={partnerNotif}
            onValueChange={setPartnerNotif}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={partnerNotif ? '#2563EB' : '#F1F5F9'}
          />
        </View>

        <View className="flex-row justify-between items-center py-2.5">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-medium text-text-primary">Capsule Unlocks</Text>
            <Text className="text-2xs text-text-secondary mt-0.5">Notify when a locked time capsule opens</Text>
          </View>
          <Switch
            value={capsuleNotif}
            onValueChange={setCapsuleNotif}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={capsuleNotif ? '#2563EB' : '#F1F5F9'}
          />
        </View>
      </Card>

      {/* Premium Visual Theme Selector Card */}
      <Card className="p-5 mb-5">
        <Text className="text-base font-semibold text-text-primary mb-4">Custom Color Themes</Text>
        <Text className="text-xs text-text-secondary leading-normal mb-3">
          Select an active color palette to personalize the app gradients and highlights.
        </Text>
        <View className="flex-row gap-2 mt-1">
          {[
            { id: 'default', name: 'Blue/White', color: 'bg-blue-500' },
            { id: 'dark', name: 'Dark Mode', color: 'bg-slate-900' },
            { id: 'soft', name: 'Soft Blue', color: 'bg-sky-300' },
          ].map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => {
                setSelectedTheme(theme.id as 'default' | 'dark' | 'soft');
                setThemePreference(theme.id as 'default' | 'dark' | 'soft');
              }}
              className={`flex-1 p-3 rounded-2xl border flex-col items-center gap-1.5 ${
                selectedTheme === theme.id
                  ? 'border-primary-600 bg-blue-50/15'
                  : 'border-neutral-border bg-white'
              }`}
            >
              <View className={`w-8 h-8 rounded-full ${theme.color} shadow-sm`} />
              <Text
                className={`text-[10px] font-bold text-center ${
                  selectedTheme === theme.id ? 'text-primary-600' : 'text-text-secondary'
                }`}
              >
                {theme.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card className="p-5 mb-5 border border-blue-100 bg-blue-50/20">
        <Text className="text-base font-semibold text-text-primary mb-4">Controlled Mature Mode</Text>
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-medium text-text-primary">Enable intimacy prompts</Text>
            <Text className="text-2xs text-text-secondary mt-0.5">Optional, 18+, and focused on respectful relationship-building.</Text>
          </View>
          <Switch
            value={matureModeEnabled}
            onValueChange={(value) => {
              if (value) {
                Alert.alert('Age Confirmation', 'Only enable this if you are 18 or older.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'I am 18+', onPress: () => {
                    setMatureModeEnabled(true);
                  }},
                ]);
              } else {
                setMatureModeEnabled(false);
              }
            }}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={matureModeEnabled ? '#2563EB' : '#F1F5F9'}
          />
        </View>
      </Card>

      {/* Reflective Soundscapes Loops Player Card */}
      <Card className="p-5 mb-5 border border-primary-100 bg-blue-50/10">
        <Text className="text-base font-semibold text-text-primary mb-4">🎵 Reflective Soundscapes</Text>
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold text-text-primary">Enable Lo-fi Loop</Text>
            <Text className="text-2xs text-text-secondary mt-0.5">Plays a calming acoustic loop during writing sessions</Text>
          </View>
          <Switch
            value={soundscapeEnabled}
            onValueChange={setSoundscapeEnabled}
            trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
            thumbColor={soundscapeEnabled ? '#2563EB' : '#F1F5F9'}
          />
        </View>

        {soundscapeEnabled && (
          <View className="border-t border-slate-100/50 pt-3">
            <Text className="text-2xs font-semibold text-text-secondary mb-2">Ambient Tracks</Text>
            <View className="flex-row gap-2">
              {SOUNDSCAPE_TRACKS.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  onPress={() => setSelectedSound(track.id)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    selectedSound === track.id
                      ? 'bg-primary-100 border-primary-600'
                      : 'bg-white border-neutral-border'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      selectedSound === track.id ? 'text-primary-600' : 'text-text-secondary'
                    }`}
                  >
                    {track.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row items-center justify-center bg-white border border-slate-150 rounded-xl p-3 mt-3 gap-3">
              <Text className="text-base">🔊</Text>
              <Text className="text-3xs font-semibold text-primary-600">
                {soundscapeEnabled
                  ? `Playing: ${SOUNDSCAPE_TRACKS.find((t) => t.id === selectedSound)?.name ?? 'Ambient loop'}`
                  : 'Enable the switch above to preview ambient audio'}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Danger Zone Section */}
      <Card className="p-5 border border-red-100 bg-red-50/10">
        <Text className="text-base font-semibold text-red-600 mb-4">Danger Zone</Text>
        
        <View className="gap-3">
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="secondary"
            className="w-full border border-slate-200 bg-white"
          />
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="py-3 items-center active:opacity-70"
          >
            <Text className="text-xs font-semibold text-red-600 underline">Delete Account Permanently</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
    <BottomNav />
    </ScreenShell>
  );
}
