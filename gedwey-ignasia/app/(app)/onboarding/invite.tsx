import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserProfile, useUpdateProfile, usePairPartner } from '../../../lib/queries/profile';
import { useAuthStore } from '../../../lib/store/authStore';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Setting up your invite code...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect with Partner</Text>
          <Text style={styles.subtitle}>
            Share moments, compare daily moods, and grow closer by pairing your accounts.
          </Text>
        </View>

        {/* Your Code Section */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Your Invite Code</Text>
          <TouchableOpacity
            style={styles.codeContainer}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text style={styles.codeText}>{profile?.invite_code || '------'}</Text>
            <Text style={styles.copyLabel}>Tap to Copy</Text>
          </TouchableOpacity>
          <Text style={styles.cardDesc}>
            Give this code to your partner so they can enter it on their device.
          </Text>
        </View>

        {/* Partner Code Section */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Enter Partner Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. X87G2K"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            value={partnerCode}
            onChangeText={setPartnerCode}
          />
          <TouchableOpacity
            style={[styles.primaryButton, pairPartner.isPending && styles.buttonDisabled]}
            onPress={handlePair}
            disabled={pairPartner.isPending}
            activeOpacity={0.8}
          >
            {pairPartner.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Pair & Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip / Back Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={pairPartner.isPending}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={pairPartner.isPending}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 4,
  },
  copyLabel: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
});
