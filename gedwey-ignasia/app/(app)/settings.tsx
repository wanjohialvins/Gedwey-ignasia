import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { uriToUint8Array } from '../../lib/fileUtils';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import {
  useUserProfile,
  useUpdateProfile,
  usePairPartner,
  useUnpairPartner,
} from '../../lib/queries/profile';
import { Button } from '../../components/Button';
import { formatShortDate } from '../../lib/dateUtils';
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
  const [settingsTab, setSettingsTab] = useState<'app' | 'partner'>('app');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loveLanguage, setLoveLanguage] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [stage, setStage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'default' | 'dark' | 'soft' | 'midnight' | 'rose' | 'forest' | 'cream' | 'slate'>('default');
  const [matureModeEnabled, setMatureModeEnabled] = useState(false);
  const [sessionNotif, setSessionNotif] = useState(true);
  const [partnerNotif, setPartnerNotif] = useState(true);
  const [capsuleNotif, setCapsuleNotif] = useState(true);
  const [soundscapeEnabled, setSoundscapeEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState('acoustic');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
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
      setSelectedTheme((profile.theme_preference as typeof selectedTheme) || 'default');
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

  // Autosave debounce mechanism
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true); // skip autosave on first render

  const doAutoSave = useCallback(async () => {
    if (!user || !displayName.trim() || initialLoadRef.current) return;
    setAutoSaveStatus('saving');
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
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err: any) {
      console.error('[Settings] Autosave failed:', err.message);
      setAutoSaveStatus('idle');
    }
  }, [user, displayName, bio, loveLanguage, stage, avatarUrl, selectedTheme, matureModeEnabled, sessionNotif, partnerNotif, capsuleNotif, soundscapeEnabled, selectedSound, updateProfile]);

  // Debounced autosave: trigger 1.5s after any settings field change
  useEffect(() => {
    if (initialLoadRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      doAutoSave();
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [displayName, bio, loveLanguage, stage, selectedTheme, matureModeEnabled, sessionNotif, partnerNotif, capsuleNotif, soundscapeEnabled, selectedSound]);

  // After initial profile data loads, mark initial load complete with a small delay
  useEffect(() => {
    if (profile && initialLoadRef.current) {
      const t = setTimeout(() => { initialLoadRef.current = false; }, 800);
      return () => clearTimeout(t);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }
    if (!user) return;
    await doAutoSave();
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
      const bytes = await uriToUint8Array(asset.uri);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('profile-images').upload(path, bytes, {
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
      <ScreenShell className="flex-1">
        <View className="flex-1 px-4 pt-16">
          <View className="flex-row items-center mb-6">
            <Skeleton width={80} height={20} className="mr-4" />
            <Skeleton width={150} height={28} />
          </View>
          <Card glass className="p-5 mb-5">
            <Skeleton width={120} height={20} className="mb-4" />
            <Skeleton width="100%" height={44} className="mb-3 rounded-xl" />
            <Skeleton width="100%" height={44} className="rounded-xl" />
          </Card>
          <Card glass className="p-5 mb-5">
            <Skeleton width={150} height={20} className="mb-4" />
            <Skeleton width="100%" height={80} className="rounded-xl" />
          </Card>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* ── Standardized Premium Header ── */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-100 items-center justify-center rounded-full active:opacity-75 shadow-xs"
          >
            <AppIcon name="arrow-back" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name={NAV_ICONS.profileActive} size={22} color="#4F46E5" />
            <Text className="text-base font-extrabold text-slate-800">Profile & Setup</Text>
            <DevBadge />
          </View>
          <View className="w-10" />
        </View>

        {/* ── Tabs Sliding Selector ── */}
        <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200/40">
          <TouchableOpacity
            onPress={() => setSettingsTab('app')}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
              settingsTab === 'app' ? 'bg-white shadow-xs' : ''
            }`}
            activeOpacity={0.8}
          >
            <AppIcon
              name={NAV_ICONS.settings}
              size={16}
              color={settingsTab === 'app' ? '#4F46E5' : '#64748B'}
            />
            <Text
              className={`text-xs font-extrabold ml-2 ${
                settingsTab === 'app' ? 'text-primary-600' : 'text-slate-500'
              }`}
            >
              Profile & App
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSettingsTab('partner')}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
              settingsTab === 'partner' ? 'bg-white shadow-xs' : ''
            }`}
            activeOpacity={0.8}
          >
            <AppIcon
              name={NAV_ICONS.partner}
              size={16}
              color={settingsTab === 'partner' ? '#4F46E5' : '#64748B'}
            />
            <Text
              className={`text-xs font-extrabold ml-2 ${
                settingsTab === 'partner' ? 'text-primary-600' : 'text-slate-500'
              }`}
            >
              Partner Setup
            </Text>
          </TouchableOpacity>
        </View>

        {settingsTab === 'app' ? (
          <>
            {/* Profile Section */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Profile Settings</Text>
              
              <View className="items-center mb-6">
                <TouchableOpacity onPress={handlePickAvatar} className="items-center active:opacity-85">
                  {avatarUrl ? (
                    <View className="relative">
                      <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full border-2 border-indigo-500/20" />
                      <View className="absolute bottom-0 right-0 bg-indigo-650 bg-indigo-650 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-sm">
                        <AppIcon name="camera" size={14} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-indigo-500/20 items-center justify-center relative">
                      <Text className="text-2xl font-extrabold text-indigo-600">
                        {(displayName || user?.email || 'G').slice(0, 1).toUpperCase()}
                      </Text>
                      <View className="absolute bottom-0 right-0 bg-indigo-650 bg-indigo-650 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-sm">
                        <AppIcon name="camera" size={14} color="#fff" />
                      </View>
                    </View>
                  )}
                  <Text className="text-3xs font-extrabold text-indigo-600 uppercase tracking-wider mt-3">Change Avatar</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-4">
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
              </View>

              <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mt-5 mb-2">My Love Language</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {[
                  'Words of Affirmation',
                  'Acts of Service',
                  'Receiving Gifts',
                  'Quality Time',
                  'Physical Touch',
                ].map((option) => {
                  const active = loveLanguage === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setLoveLanguage(option)}
                      className={`px-3.5 py-2 rounded-full border ${
                        active ? 'bg-primary-50/50 border-primary-600' : 'bg-white border-slate-100'
                      }`}
                    >
                      <Text className={`text-3xs font-bold ${active ? 'text-primary-600' : 'text-slate-500'}`}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-slate-100/60">
                <View className="flex-row items-center gap-2">
                  {autoSaveStatus === 'saving' && (
                    <Text className="text-3xs text-slate-400 italic">Saving changes...</Text>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <Text className="text-3xs text-emerald-600 font-extrabold">✓ Saved</Text>
                  )}
                  {autoSaveStatus === 'idle' && (
                    <Text className="text-3xs text-slate-400">Autosaves on change</Text>
                  )}
                </View>
                <Button
                  title="Force Save"
                  onPress={handleSaveProfile}
                  loading={isSavingProfile}
                  variant="secondary"
                  className="px-4 py-2 rounded-xl"
                />
              </View>
            </Card>

            {/* Custom Color Themes */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Color Themes</Text>
              <Text className="text-3xs text-slate-400 leading-normal mb-4">
                Personalize application highlights and accent color schemes globally.
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {[
                  { id: 'default', name: 'Lilac Blue', color: 'bg-indigo-600' },
                  { id: 'dark', name: 'Dark Mode', color: 'bg-slate-900' },
                  { id: 'soft', name: 'Sky Soft', color: 'bg-sky-400' },
                  { id: 'midnight', name: 'Midnight', color: 'bg-violet-950' },
                  { id: 'rose', name: 'Rose Sunset', color: 'bg-rose-450' },
                  { id: 'forest', name: 'Forest Teal', color: 'bg-emerald-700' },
                  { id: 'cream', name: 'Cream Oat', color: 'bg-amber-100 border border-amber-200' },
                  { id: 'slate', name: 'Slate Gray', color: 'bg-slate-600' },
                ].map((theme) => {
                  const active = selectedTheme === theme.id;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => setSelectedTheme(theme.id as typeof selectedTheme)}
                      className={`w-[23%] p-2.5 rounded-xl border flex-col items-center gap-1.5 active:opacity-90 ${
                        active ? 'border-primary-600 bg-blue-50/20' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <View className={`w-7 h-7 rounded-full ${theme.color} shadow-xs`} />
                      <Text className={`text-[8px] font-extrabold text-center ${active ? 'text-primary-600' : 'text-slate-500'}`}>
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Reflective Soundscapes */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Ambient Audio</Text>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-slate-800">Calm Soundscapes</Text>
                  <Text className="text-3xs text-slate-400 mt-0.5 leading-normal">Plays a calming acoustic loop during writing sessions</Text>
                </View>
                <Switch
                  value={soundscapeEnabled}
                  onValueChange={setSoundscapeEnabled}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={soundscapeEnabled ? '#2563EB' : '#F1F5F9'}
                />
              </View>

              {soundscapeEnabled && (
                <View className="border-t border-slate-100/60 pt-4 mt-2 animate-fade-in">
                  <Text className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-0.5">Select Ambient Audio Track</Text>
                  <View className="flex-row gap-2">
                    {SOUNDSCAPE_TRACKS.map((track) => {
                      const active = selectedSound === track.id;
                      return (
                        <TouchableOpacity
                          key={track.id}
                          onPress={() => setSelectedSound(track.id)}
                          className={`flex-1 py-2.5 rounded-xl border items-center active:opacity-85 ${
                            active ? 'bg-primary-50 border-primary-600' : 'bg-white border-slate-100'
                          }`}
                        >
                          <Text className={`text-3xs font-extrabold ${active ? 'text-primary-600' : 'text-slate-500'}`}>
                            {track.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View className="flex-row items-center justify-center bg-indigo-50/20 border border-indigo-100/40 rounded-xl p-2.5 mt-3 gap-2">
                    <Text className="text-xs">🔊</Text>
                    <Text className="text-[10px] font-extrabold text-primary-600 uppercase tracking-wider">
                      Playing Ambient Preview
                    </Text>
                  </View>
                </View>
              )}
            </Card>

            {/* Danger Zone */}
            <Card className="p-5 border border-red-100 bg-red-50/5 mb-6">
              <Text className="text-2xs font-extrabold text-red-650 uppercase tracking-widest mb-4">Danger Zone</Text>
              <View className="gap-3">
                <Button
                  title="Sign Out Account"
                  onPress={handleSignOut}
                  variant="secondary"
                  className="w-full border border-slate-200 bg-white"
                />
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  className="py-2.5 items-center active:opacity-75"
                >
                  <Text className="text-3xs font-bold text-red-650 uppercase tracking-wider underline">Delete Account Permanently</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        ) : (
          <>
            {/* Connection & Pairing Section */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Connection Status</Text>
              {isPaired ? (
                <View className="gap-4">
                  <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xl">❤️</Text>
                      <View>
                        <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest">Paired Partner</Text>
                        <Text className="text-sm font-bold text-slate-800 capitalize mt-0.5">
                          {partnerProfile?.display_name || 'Your Partner'}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-emerald-500 px-2.5 py-1 rounded-lg">
                      <Text className="text-[9px] font-extrabold text-white uppercase tracking-wider">Active</Text>
                    </View>
                  </View>
                  <Button
                    title="Disconnect Partner"
                    onPress={handleUnpair}
                    loading={isUnpairing}
                    variant="secondary"
                    className="border border-red-200 bg-red-50 text-red-650 mt-1 rounded-xl"
                  />
                </View>
              ) : (
                <View className="gap-4">
                  <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">My Invite Code</Text>
                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="text-lg font-extrabold text-primary-600 tracking-wider">
                        {profile?.invite_code || '—'}
                      </Text>
                      {profile?.invite_code && (
                        <TouchableOpacity
                          onPress={handleCopyCode}
                          className="bg-primary-50 px-4 py-2 rounded-xl active:opacity-75"
                        >
                          <Text className="text-3xs font-extrabold text-primary-600 uppercase tracking-wider">Copy Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {showCustomForm ? (
                      <View className="w-full mt-4 border-t border-slate-100 pt-4">
                        <Input
                          placeholder="Custom Code (3-10 characters)"
                          autoCapitalize="characters"
                          autoCorrect={false}
                          maxLength={10}
                          value={customCode}
                          onChangeText={(val) => setCustomCode(val.replace(/[^A-Za-z0-9]/g, ''))}
                        />
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            className="flex-1 bg-slate-100 h-10 rounded-xl items-center justify-center active:bg-slate-200"
                            onPress={() => {
                              setShowCustomForm(false);
                              setCustomCode('');
                            }}
                            disabled={isCustomSaving}
                          >
                            <Text className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider">Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-[2] bg-primary-600 h-10 rounded-xl items-center justify-center active:bg-primary-700"
                            onPress={handleSaveCustomCode}
                            disabled={isCustomSaving || customCode.trim().length < 3}
                          >
                            <Text className="text-3xs font-extrabold text-white uppercase tracking-wider">
                              {isCustomSaving ? 'Saving...' : 'Save Code'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row gap-3 mt-4 border-t border-slate-100 pt-4">
                        <TouchableOpacity
                          onPress={() => {
                            setCustomCode(profile?.invite_code || '');
                            setShowCustomForm(true);
                          }}
                          className="flex-1 items-center justify-center py-2.5 bg-slate-100 rounded-xl active:bg-slate-200"
                        >
                          <Text className="text-3xs font-bold text-slate-500 uppercase tracking-wider">
                            {profile?.invite_code ? 'Customize Code' : 'Set Custom'}
                          </Text>
                        </TouchableOpacity>
                        {!profile?.invite_code && (
                          <TouchableOpacity
                            onPress={handleGenerateRandomCode}
                            className="flex-1 items-center justify-center py-2.5 bg-primary-50 rounded-xl active:bg-blue-100"
                          >
                            <Text className="text-3xs font-bold text-primary-600 uppercase tracking-wider">Generate Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>

                  <View className="border-t border-slate-100 pt-4">
                    <Input
                      label="Pair with a Partner"
                      placeholder="Enter partner's invite code"
                      value={partnerCode}
                      onChangeText={setPartnerCode}
                    />
                    <Button
                      title="Connect Partner"
                      onPress={handlePair}
                      loading={isPairing}
                      className="mt-3.5 w-full"
                    />
                  </View>
                </View>
              )}
            </Card>

            {/* Relationship Stage Selector */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Relationship Stage</Text>
              <Text className="text-3xs text-slate-400 leading-normal mb-4">
                Define the level of emotional sharing, customized to your milestones.
              </Text>
              <View className="flex-row gap-2 mt-1">
                {['discovery', 'early_dating', 'couples'].map((s) => {
                  const active = stage === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStage(s)}
                      className={`flex-1 py-3 rounded-xl border items-center capitalize ${
                        active ? 'bg-primary-50 border-primary-600' : 'bg-white border-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-2xs font-extrabold ${active ? 'text-primary-600' : 'text-slate-500'}`}
                      >
                        {s.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Notification Preferences */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Notifications</Text>
              
              <View className="flex-row justify-between items-center py-3 border-b border-slate-100/60">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-slate-800">Daily Sessions</Text>
                  <Text className="text-3xs text-slate-400 mt-0.5 leading-normal">Receive reminders for new daily cards</Text>
                </View>
                <Switch
                  value={sessionNotif}
                  onValueChange={setSessionNotif}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={sessionNotif ? '#2563EB' : '#F1F5F9'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-slate-100/60">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-slate-800">Partner Responses</Text>
                  <Text className="text-3xs text-slate-400 mt-0.5 leading-normal">Get notified when partner reveals answers</Text>
                </View>
                <Switch
                  value={partnerNotif}
                  onValueChange={setPartnerNotif}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={partnerNotif ? '#2563EB' : '#F1F5F9'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-slate-800">Capsule Unlocks</Text>
                  <Text className="text-3xs text-slate-400 mt-0.5 leading-normal">Notify when a locked time capsule opens</Text>
                </View>
                <Switch
                  value={capsuleNotif}
                  onValueChange={setCapsuleNotif}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={capsuleNotif ? '#2563EB' : '#F1F5F9'}
                />
              </View>
            </Card>

            {/* Controlled Mature Mode */}
            <Card className="p-5 mb-5 border border-slate-100 bg-white">
              <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Controlled Mature Mode</Text>
              <View className="flex-row justify-between items-center mt-1">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-slate-800">Enable Intimacy Prompts</Text>
                  <Text className="text-3xs text-slate-400 mt-0.5 leading-normal">Optional, 18+, and focused on respectful relationship-building.</Text>
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

            {/* Partner Profile Summary Card */}
            {isPaired && partnerProfile && (
              <Card className="p-5 mb-5 border border-slate-100 bg-white">
                <Text className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest mb-3.5">Partner Summary</Text>
                <View className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">Display Name</Text>
                  <Text className="text-sm font-bold text-slate-800 capitalize mb-3">
                    {partnerProfile.display_name || 'Partner'}
                  </Text>
                  
                  {partnerProfile.love_language && (
                    <>
                      <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">Love Language</Text>
                      <Text className="text-2xs text-primary-600 font-extrabold mb-3">
                        {partnerProfile.love_language}
                      </Text>
                    </>
                  )}
                  
                  {partnerProfile.bio && (
                    <>
                      <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bio</Text>
                      <Text className="text-2xs text-slate-500 leading-relaxed font-semibold">
                        "{partnerProfile.bio}"
                      </Text>
                    </>
                  )}
                  
                  <TouchableOpacity
                    onPress={() => router.push('/partner')}
                    className="mt-4 pt-3 border-t border-slate-100"
                  >
                    <Text className="text-3xs font-extrabold text-primary-600 uppercase tracking-widest text-center">View Full Profile →</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          </>
        )}

        {/* Version & Update Metadata Footer */}
        <View className="items-center py-6 mt-4 gap-1">
          <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gedwey Ignasia v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
          <Text className="text-[8px] text-slate-400">
            {Updates.updateId ? `Update: ${Updates.updateId.substring(0, 8)}` : 'Local Dev'}
            {Updates.createdAt ? ` · Released: ${formatShortDate(Updates.createdAt)}` : ''}
          </Text>
        </View>
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
