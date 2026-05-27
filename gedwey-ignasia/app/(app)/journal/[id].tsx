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
import { useJournalEntry } from '../../../lib/queries/journal';

export default function JournalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: entry, isLoading, error } = useJournalEntry(id ?? '');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading memory...</Text>
      </View>
    );
  }

  if (error || !entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Failed to load memory</Text>
            <Text style={styles.errorSubtitle}>
              {error?.message || 'The requested journal entry could not be found.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/journal')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Back to Journal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(entry.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const creatorName = entry.profiles?.display_name || 'Partner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header section */}
          <View style={styles.header}>
            <Text style={styles.title}>{entry.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaDate}>{formattedDate}</Text>
              <Text style={styles.metaAuthor}>Written by {creatorName}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content Body */}
          <Text style={styles.bodyText}>{entry.content}</Text>
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
  header: {
    paddingTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 32,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  metaAuthor: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    textAlign: 'left',
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
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
