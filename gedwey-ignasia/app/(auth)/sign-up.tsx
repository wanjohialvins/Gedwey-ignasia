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

  if (loading) {
    return <GedweyLoader subtitle="creating your account..." />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-4">
        {/* Header */}
        <View className="items-center mb-8">
          <BrandLogo size={78} />
          <Text className="text-sm text-text-muted mt-3 text-center px-8">
            Start your journey of intentional connection.
          </Text>
        </View>

        {/* Form Card */}
        <Card className="p-6">
          <Text className="text-2xl font-semibold text-text-primary mb-6">Create Account</Text>

          <Input
            placeholder="Display name"
            autoCapitalize="words"
            value={displayName}
            onChangeText={setDisplayName}
          />

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

          <Input
            placeholder="Confirm password"
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Sign Up Button */}
          <Button
            title={loading ? 'Creating account...' : 'Create Account'}
            onPress={handleSignUp}
            loading={loading}
            className="mt-3"
          />
        </Card>

        {/* Footer */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-text-secondary">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text className="text-sm text-primary-600 font-semibold"> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
