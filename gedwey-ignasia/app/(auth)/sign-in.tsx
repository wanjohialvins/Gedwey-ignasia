import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Sign In Failed', error.message);
      }
      // If successful, the auth listener in _layout.tsx will redirect automatically
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Moments</Text>
          <Text style={styles.appSubtitle}>for Two</Text>
          <Text style={styles.tagline}>Small intentional moments build strong relationships.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>

          <TextInput
            style={[styles.input, email ? styles.inputFocused : null]}
            placeholder="Email address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, password ? styles.inputFocused : null]}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.footerLink}> Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#3B82F6',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: '#3B82F6',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#475569',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
