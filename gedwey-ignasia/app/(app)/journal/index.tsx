import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useSessionHistory } from '../../../lib/queries/sessions';
import { useJournalEntries, JournalEntry } from '../../../lib/queries/journal';

export default function JournalListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch profiles and session history to enforce unlock gates
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id ?? '');
  const coupleId = profile?.couple_id ?? '';

  const { data: sessionHistory, isLoading: historyLoading } = useSessionHistory(coupleId);
  const { data: entries, isLoading: entriesLoading } = useJournalEntries(coupleId);

  const isLoading = profileLoading || historyLoading || entriesLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading journal...</Text>
      </View>
    );
  }

  const completedSessionsCount = sessionHistory?.length ?? 0;
  const isJournalUnlocked = completedSessionsCount >= 5;

  // Safeguard gate in case of direct routing
  if (!profile?.couple_id || !isJournalUnlocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkText}>← Home</Text>
          </TouchableOpacity>
          <View style={styles.lockedContent}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.lockedTitle}>Journal is Locked</Text>
            <Text style={styles.lockedSubtitle}>
              Complete 5 shared couple sessions to unlock your private memory book.
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min((completedSessionsCount / 5) * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedSessionsCount} of 5 sessions completed
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/session/start')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Start a Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderJournalItem = ({ item }: { item: JournalEntry }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const creatorName = item.profiles?.display_name || 'Partner';

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => router.push(`/journal/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formattedDate}</Text>
          <Text style={styles.cardAuthor}>By {creatorName}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardSnippet} numberOfLines={2}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backLinkInline} onPress={() => router.replace('/')}>
            <Text style={styles.backLinkTextInline}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Shared Journal</Text>
          <Text style={styles.subtitle}>Our private memory book</Text>
        </View>

        {entries && entries.length > 0 ? (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderJournalItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          /* Empty State */
          <View style={styles.emptyContent}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Our Memory Book</Text>
            <Text style={styles.emptySubtitle}>
              This is your private couple space. Write down your first memory today!
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/journal/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Write First Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Action Button */}
        {entries && entries.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/journal/create')}
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
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  backLinkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    paddingTop: 10,
    marginBottom: 20,
  },
  backLinkInline: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 6,
  },
  backLinkTextInline: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
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
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardAuthor: {
    fontSize: 12,
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSnippet: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
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
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
  },
  progressBarContainer: {
    height: 8,
    width: '80%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 24,
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
