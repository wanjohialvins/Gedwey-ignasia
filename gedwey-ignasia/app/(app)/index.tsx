import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome 👋</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>You're in!</Text>
          <Text style={styles.cardText}>
            Your account is set up and connected to Supabase. We'll build out the full experience next.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  email: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: '#DBEAFE',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  signOutText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});
