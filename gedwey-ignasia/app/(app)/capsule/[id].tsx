import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTimeCapsule } from '../../../lib/queries/capsules';

export default function CapsuleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: capsule, isLoading, error } = useTimeCapsule(id ?? '');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Unsealing time capsule...</Text>
      </View>
    );
  }

  if (error || !capsule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Failed to load capsule</Text>
            <Text style={styles.errorSubtitle}>
              {error?.message || 'The requested time capsule could not be found.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/capsule')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Back to Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Client-side date check safeguard
  const openDate = new Date(capsule.open_date);
  const now = new Date();
  const isLocked = now.getTime() < openDate.getTime();

  if (isLocked) {
    const formattedOpenDate = openDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.lockedContent}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.lockedTitle}>Capsule is Sealed</Text>
            <Text style={styles.lockedSubtitle}>
              This letter to the future is currently locked. Love grows in waiting.
            </Text>

            <View style={styles.lockedCard}>
              <Text style={styles.lockedLabel}>Capsule Title</Text>
              <Text style={styles.lockedValueTitle}>{capsule.title}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.lockedLabel}>Unlocks on</Text>
              <Text style={styles.lockedValueDate}>{formattedOpenDate}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Back to Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const creatorName = capsule.profiles?.display_name || 'Partner';
  const formattedOpenDate = openDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Confetti celebration header */}
          <View style={styles.unlockedHeader}>
            <Text style={styles.revealEmoji}>✨</Text>
            <Text style={styles.revealTitle}>Vault Unlocked!</Text>
            <Text style={styles.revealSubtitle}>
              An intimate letter from the past has been unsealed.
            </Text>
          </View>

          {/* Capsule Card */}
          <View style={styles.revealedCard}>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardAuthor}>From {creatorName}</Text>
              <Text style={styles.cardDate}>Unsealed {formattedOpenDate}</Text>
            </View>
            
            <Text style={styles.revealedTitle}>{capsule.title}</Text>
            <View style={styles.divider} />
            <Text style={styles.revealedBody}>{capsule.content}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButtonOutlined}
            onPress={() => router.replace('/capsule')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonTextOutlined}>Back to Vault</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  primaryButtonOutlined: {
    backgroundColor: '#EFF6FF',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 16,
  },
  buttonTextOutlined: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
    alignItems: 'center',
  },
  lockedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  lockedValueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  lockedValueDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
    marginBottom: 16,
  },
  unlockedHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  revealEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  revealTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  revealSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  revealedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
  },
  revealedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  revealedBody: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
});
