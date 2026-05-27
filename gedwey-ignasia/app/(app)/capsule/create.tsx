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
import { useCreateTimeCapsule } from '../../../lib/queries/capsules';

interface Timeframe {
  label: string;
  sublabel: string;
  days: number;
}

const TIMEFRAMES: Timeframe[] = [
  { label: '1 Week', sublabel: 'Quick surprise', days: 7 },
  { label: '1 Month', sublabel: 'A reflection of today', days: 30 },
  { label: '3 Months', sublabel: 'Season change', days: 90 },
  { label: '6 Months', sublabel: 'Half a year perspective', days: 180 },
  { label: '1 Year', sublabel: 'Our anniversary', days: 365 },
];

export default function CapsuleCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile } = useUserProfile(user?.id ?? '');
  const createCapsule = useCreateTimeCapsule();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | null>(null);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your time capsule.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Message Required', 'Please write a message to seal inside.');
      return;
    }

    let daysToLock = 0;
    if (isCustom) {
      const parsedDays = parseInt(customDays, 10);
      if (isNaN(parsedDays) || parsedDays <= 0) {
        Alert.alert('Invalid Days', 'Please enter a valid number of days greater than 0.');
        return;
      }
      daysToLock = parsedDays;
    } else {
      if (!selectedTimeframe) {
        Alert.alert('Timeframe Required', 'Please select when this capsule should unlock.');
        return;
      }
      daysToLock = selectedTimeframe.days;
    }

    const coupleId = profile?.couple_id;
    const creatorId = user?.id;

    if (!coupleId || !creatorId) {
      Alert.alert('Error', 'Unable to resolve couple identity. Ensure you are paired.');
      return;
    }

    // Calculate open date
    const openDate = new Date();
    openDate.setDate(openDate.getDate() + daysToLock);

    try {
      await createCapsule.mutateAsync({
        coupleId,
        creatorId,
        title: title.trim(),
        content: content.trim(),
        openDate: openDate.toISOString(),
      });
      router.replace('/capsule');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not seal your time capsule.');
    }
  };

  const isPending = createCapsule.isPending;

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

          <Text style={styles.title}>Seal a Capsule</Text>
          <Text style={styles.subtitle}>
            Lock a letter or photo reference. Neither of you will be able to read it until the countdown ends.
          </Text>

          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capsule Title</Text>
              <TextInput
                style={styles.inputTitle}
                placeholder="E.g., Read this on our anniversary..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Content */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sealed Message</Text>
              <TextInput
                style={styles.inputContent}
                placeholder="Write your letter to the future..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </View>

            {/* Timeframe selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seal Duration</Text>
              
              <View style={styles.timeframeGrid}>
                {TIMEFRAMES.map((tf) => {
                  const isSelected = !isCustom && selectedTimeframe?.days === tf.days;
                  return (
                    <TouchableOpacity
                      key={tf.days}
                      style={[styles.tfCard, isSelected && styles.tfCardSelected]}
                      onPress={() => {
                        setIsCustom(false);
                        setSelectedTimeframe(tf);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tfLabel, isSelected && styles.tfLabelSelected]}>
                        {tf.label}
                      </Text>
                      <Text style={styles.tfSublabel}>{tf.sublabel}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.tfCard, isCustom && styles.tfCardSelected]}
                  onPress={() => {
                    setIsCustom(true);
                    setSelectedTimeframe(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tfLabel, isCustom && styles.tfLabelSelected]}>
                    Custom
                  </Text>
                  <Text style={styles.tfSublabel}>Specify days offset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Days offset input */}
            {isCustom && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Number of days to seal</Text>
                <TextInput
                  style={styles.inputTitle}
                  placeholder="E.g., 45"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={customDays}
                  onChangeText={setCustomDays}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!title.trim() || !content.trim() || (!selectedTimeframe && !isCustom) || isPending) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !content.trim() || (!selectedTimeframe && !isCustom) || isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Seal in Time Vault</Text>
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
    marginBottom: 20,
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
    minHeight: 120,
    lineHeight: 22,
  },
  timeframeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: 140,
    justifyContent: 'center',
  },
  tfCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  tfLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  tfLabelSelected: {
    color: '#2563EB',
  },
  tfSublabel: {
    fontSize: 11,
    color: '#64748B',
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
