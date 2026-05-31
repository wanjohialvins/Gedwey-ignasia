import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { BrandLogo } from '../../components/BrandLogo';
import { GedweyLoader } from '../../components/GedweyLoader';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address to resend confirmation.');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        Alert.alert('Email Sent', 'A confirmation email has been sent. Please check your inbox.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to resend confirmation email.');
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        Alert.alert('Sign In Failed', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <GedweyLoader subtitle="signing you in..." />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-4">
        {/* Header */}
        <View className="items-center mb-10">
          <BrandLogo size={78} />
          <Text className="text-sm text-text-muted mt-3 text-center px-8">
            Small intentional moments build strong relationships.
          </Text>
        </View>

        {/* Form Card */}
        <Card className="p-6">
          <Text className="text-2xl font-semibold text-text-primary mb-6">Welcome back</Text>

          <Input
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          {/* Sign In Button */}
          <Button
            title={loading ? 'Signing in...' : 'Sign In'}
            onPress={handleSignIn}
            loading={loading}
            className="mt-3"
          />

          {/* Resend Confirmation Link */}
          {errorMessage && errorMessage.includes('email not confirmed') && (
            <TouchableOpacity
              onPress={handleResendConfirmation}
              activeOpacity={0.8}
              className="mt-3 items-center"
            >
              <Text className="color-primary-600 text-sm underline font-medium">
                Resend confirmation email
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Footer */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-text-secondary">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text className="text-sm text-primary-600 font-semibold"> Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
