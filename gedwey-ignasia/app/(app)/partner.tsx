import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { Card } from '../../components/Card';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { useAuthStore } from '../../lib/store/authStore';
import { useCouple, useUserProfile } from '../../lib/queries/profile';
import { useTheme } from '../../lib/hooks/useTheme';

export default function PartnerProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: partner } = useUserProfile(profile?.partner_id ?? '');
  const { data: couple } = useCouple(profile?.couple_id ?? '');
  const { theme } = useTheme();

  if (!profile?.couple_id || !partner) {
    return (
      <ScreenShell className="flex-1">
        <View className="flex-1 px-4 pt-16 items-center justify-center">
          <Text className="text-lg font-bold mb-2" style={{ color: theme.textPrimary }}>No partner yet</Text>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Text style={{ color: theme.accent }}>Go to settings to pair</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </ScreenShell>
    );
  }

  const connectedDays = couple?.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(couple.created_at).getTime()) / 86400000))
    : 0;

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-5 flex-row items-center gap-1">
          <AppIcon name="arrow-back" size={16} color={theme.accent} />
          <Text className="text-sm font-bold" style={{ color: theme.accent }}>Back</Text>
        </TouchableOpacity>

        <View className="items-center mb-6">
          <ProfileAvatar uri={partner.avatar_url} name={partner.display_name} size={96} />
          <Text className="text-2xl font-bold capitalize mt-4" style={{ color: theme.textPrimary }}>
            {partner.display_name || 'Partner'}
          </Text>
          <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
            Connected {connectedDays} day{connectedDays !== 1 ? 's' : ''}
          </Text>
        </View>

        <Card className="p-5 mb-4">
          <Text className="text-sm font-bold mb-3" style={{ color: theme.textPrimary }}>About</Text>
          <Text className="text-sm leading-normal" style={{ color: theme.textSecondary }}>
            {partner.bio || 'No bio shared yet.'}
          </Text>
        </Card>

        {partner.love_language ? (
          <Card className="p-5 mb-4">
            <Text className="text-sm font-bold mb-2" style={{ color: theme.textPrimary }}>Love Language</Text>
            <Text className="text-sm" style={{ color: theme.accent }}>{partner.love_language}</Text>
          </Card>
        ) : null}

        {partner.birthday ? (
          <Card className="p-5 mb-4">
            <Text className="text-sm font-bold mb-2" style={{ color: theme.textPrimary }}>Birthday</Text>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              {new Date(partner.birthday + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </Text>
          </Card>
        ) : null}

        <Card className="p-5 mb-4">
          <Text className="text-sm font-bold mb-2" style={{ color: theme.textPrimary }}>Relationship Stage</Text>
          <Text className="text-sm capitalize" style={{ color: theme.textSecondary }}>
            {(partner.relationship_stage || 'couples').replace('_', ' ')}
          </Text>
        </Card>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/answers')}
            className="flex-1 p-4 rounded-2xl items-center border"
            style={{ backgroundColor: theme.accentLight, borderColor: theme.border }}
          >
            <AppIcon name={NAV_ICONS.session} size={22} color={theme.accent} />
            <Text className="text-xs font-bold mt-2" style={{ color: theme.accent }}>Shared Answers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/dates')}
            className="flex-1 p-4 rounded-2xl items-center border"
            style={{ backgroundColor: theme.accentLight, borderColor: theme.border }}
          >
            <AppIcon name={NAV_ICONS.milestone} size={22} color={theme.accent} />
            <Text className="text-xs font-bold mt-2" style={{ color: theme.accent }}>Important Dates</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
