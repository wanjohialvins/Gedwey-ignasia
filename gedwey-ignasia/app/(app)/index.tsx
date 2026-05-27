import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const isPaired = !!profile?.couple_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome 👋</Text>
        <Text style={styles.displayName}>{profile?.display_name || user?.email}</Text>
      </View>

      {/* Feature Cards */}
      <View style={styles.cardsGrid}>
        {/* Discovery Mode */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push('/discovery')}
          activeOpacity={0.85}
        >
          <Text style={styles.featureEmoji}>✨</Text>
          <Text style={styles.featureTitle}>Discovery</Text>
          <Text style={styles.featureDesc}>Share & compare answers with anyone</Text>
        </TouchableOpacity>

        {/* Sessions */}
        <TouchableOpacity
          style={[styles.featureCard, !isPaired && styles.featureCardDisabled]}
          onPress={() => {
            if (isPaired) {
              router.push('/session/start');
            } else {
              Alert.alert('Pairing Required', 'You need to pair with a partner to start sessions. Go to settings to share your invite code.');
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.featureEmoji}>🎴</Text>
          <Text style={styles.featureTitle}>Sessions</Text>
          <Text style={styles.featureDesc}>
            {isPaired ? 'Shared couple sessions' : 'Pair with partner first'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Relationship Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Mode</Text>
          <Text style={styles.statusValue}>{profile?.app_mode?.replace('_', ' ') || '—'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Stage</Text>
          <Text style={styles.statusValue}>{profile?.relationship_stage?.replace('_', ' ') || '—'}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Partner</Text>
          <Text style={styles.statusValue}>{isPaired ? 'Paired ❤️' : 'Not paired'}</Text>
        </View>
        {!isPaired && profile?.invite_code && (
          <View style={styles.codeRow}>
            <Text style={styles.statusLabel}>Your Code</Text>
            <Text style={styles.codeValue}>{profile.invite_code}</Text>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  displayName: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  featureCardDisabled: {
    opacity: 0.6,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  codeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 2,
  },
  signOutButton: {
    backgroundColor: '#DBEAFE',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});
