import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useTimeCapsules, useOpenTimeCapsule, TimeCapsule } from '../../../lib/queries/capsules';
import { scheduleLocalNotification } from '../../../lib/notifications';

function getCountdownText(openDateString: string): { label: string; isReady: boolean } {
  const openDate = new Date(openDateString);
  const now = new Date();
  const diffMs = openDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: 'Ready to open! ✨', isReady: true };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return { label: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`, isReady: false };
  }

  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  return { label: `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} left`, isReady: false };
}

export default function CapsuleListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: capsules, isLoading: capsulesLoading } = useTimeCapsules(coupleId);
  const openTimeCapsule = useOpenTimeCapsule();

  const isLoading = profileLoading || capsulesLoading;

  // Schedule local notifications for future capsules on list load
  React.useEffect(() => {
    if (!capsules || capsules.length === 0) return;

    capsules.forEach((capsule) => {
      if (capsule.is_opened) return;
      const openTime = new Date(capsule.open_date).getTime();
      const delaySeconds = Math.floor((openTime - Date.now()) / 1000);

      if (delaySeconds > 0) {
        scheduleLocalNotification(
          'Time Capsule Unlocked! ⏳',
          `Your time capsule "${capsule.title}" is ready to be opened.`,
          delaySeconds,
          capsule.id
        );
      }
    });
  }, [capsules]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading time capsules...</Text>
      </View>
    );
  }

  const handlePressCapsule = async (item: TimeCapsule) => {
    const { label, isReady } = getCountdownText(item.open_date);

    if (!isReady) {
      Alert.alert(
        'Capsule Locked 🔒',
        `Patience! This capsule is sealed until ${new Date(item.open_date).toLocaleDateString(
          undefined,
          { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        )}. There is ${label} remaining.`
      );
      return;
    }

    if (!item.is_opened) {
      try {
        await openTimeCapsule.mutateAsync({
          capsuleId: item.id,
          coupleId: item.couple_id,
        });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not open the capsule.');
        return;
      }
    }

    router.push(`/capsule/${item.id}`);
  };

  const renderCapsuleItem = ({ item }: { item: TimeCapsule }) => {
    const { label, isReady } = getCountdownText(item.open_date);
    const creatorName = item.profiles?.display_name || 'Partner';
    
    const formattedOpenDate = new Date(item.open_date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={[styles.capsuleCard, !isReady && styles.capsuleCardLocked]}
        onPress={() => handlePressCapsule(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.creatorText}>Locked by {creatorName}</Text>
          {isReady ? (
            item.is_opened ? (
              <View style={styles.openedBadge}>
                <Text style={styles.openedBadgeText}>📖 Opened</Text>
              </View>
            ) : (
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>✨ Ready</Text>
              </View>
            )
          ) : (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>🔒 Locked</Text>
            </View>
          )}
        </View>

        <Text style={styles.capsuleTitle}>{item.title}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel}>Unlocks on</Text>
          <Text style={styles.footerValue}>{formattedOpenDate}</Text>
        </View>

        {!isReady && (
          <View style={styles.countdownRow}>
            <Text style={styles.countdownText}>Sealed: {label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Time Capsules</Text>
          <Text style={styles.subtitle}>Our sealed letters to the future</Text>
        </View>

        {capsules && capsules.length > 0 ? (
          <FlatList
            data={capsules}
            keyExtractor={(item) => item.id}
            renderItem={renderCapsuleItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          /* Empty State */
          <View style={styles.emptyContent}>
            <Text style={styles.emptyEmoji}>⏳</Text>
            <Text style={styles.emptyTitle}>Time Capsule Vault</Text>
            <Text style={styles.emptySubtitle}>
              Seal a memory, photo reference, or letter to open together in the future.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/capsule/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Seal First Capsule</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Action Button */}
        {capsules && capsules.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/capsule/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        )}
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
    paddingVertical: 4,
    marginTop: 10,
    marginBottom: 6,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 80,
    gap: 16,
  },
  capsuleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  capsuleCardLocked: {
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  lockedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  readyBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  openedBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  openedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  capsuleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  countdownRow: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2563EB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },
});
