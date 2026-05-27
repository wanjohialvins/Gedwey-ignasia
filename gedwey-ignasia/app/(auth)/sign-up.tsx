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

export default function SignUpScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert(
          'Check Your Email',
          'We sent you a confirmation link. Please verify your email to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
        );
      }
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
          <Text style={styles.tagline}>Start your journey of intentional connection.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Account</Text>

          <TextInput
            style={[styles.input, displayName ? styles.inputFocused : null]}
            placeholder="Display name"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            value={displayName}
            onChangeText={setDisplayName}
          />

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

          <TextInput
            style={[styles.input, confirmPassword ? styles.inputFocused : null]}
            placeholder="Confirm password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.footerLink}> Sign In</Text>
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
    marginBottom: 32,
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
