import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../lib/store/authStore';
import { useUserProfile } from '../../../lib/queries/profile';
import { useCreateJournalEntry } from '../../../lib/queries/journal';

export default function JournalCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const { data: profile } = useUserProfile(user?.id ?? '');
  const createEntry = useCreateJournalEntry();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your journal entry.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Content Required', 'Please write something in your journal entry.');
      return;
    }

    const coupleId = profile?.couple_id;
    const userId = user?.id;

    if (!coupleId || !userId) {
      Alert.alert('Error', 'Unable to identify couple identity. Make sure you are paired.');
      return;
    }

    try {
      await createEntry.mutateAsync({
        coupleId,
        creatorId: userId,
        title: title.trim(),
        content: content.trim(),
      });
      router.replace('/journal');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save your journal entry.');
    }
  };

  const isPending = createEntry.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>New Memory</Text>
          <Text style={styles.subtitle}>
            Capture a special moment, milestone, or reflection together.
          </Text>

          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.inputTitle}
                placeholder="Give this moment a name..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Memory Details</Text>
              <TextInput
                style={styles.inputContent}
                placeholder="What happened? How did it feel? Write down the details..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={8}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!title.trim() || !content.trim() || isPending) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save to Journal</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    gap: 16,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputTitle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  inputContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 180,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
