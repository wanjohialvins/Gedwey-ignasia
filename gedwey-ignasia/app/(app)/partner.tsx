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
import { formatMonthDay } from '../../lib/dateUtils';

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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ── Standardized Header ───────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-indigo-50/60 items-center justify-center rounded-full active:opacity-75"
          >
            <AppIcon name="arrow-back" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AppIcon name={NAV_ICONS.partner} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Partner Space</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* ── Profile Header Section ──────────────────────────────── */}
        <View className="items-center mb-6 bg-white border border-indigo-50/40 rounded-3xl p-6 shadow-2xs">
          <ProfileAvatar uri={partner.avatar_url} name={partner.display_name} size={90} />
          <Text className="text-xl font-extrabold capitalize mt-4 text-text-primary">
            {partner.display_name || 'Partner'}
          </Text>
          <Text className="text-xs text-text-secondary mt-1 font-semibold">
            Connected for {connectedDays} day{connectedDays !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* ── About Bio Card ───────────────────────────────────────── */}
        <Card className="p-4 mb-4 border border-indigo-50/40 bg-white">
          <Text className="text-3xs font-bold text-slate-450 text-slate-400 uppercase tracking-widest mb-2 px-0.5">About</Text>
          <Text className="text-sm leading-relaxed text-text-secondary font-medium px-0.5">
            {partner.bio || 'No bio shared yet.'}
          </Text>
        </Card>

        {/* ── Love Language Card ────────────────────────────────────── */}
        {partner.love_language ? (
          <Card className="p-4 mb-4 border border-indigo-50/40 bg-white">
            <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">Love Language</Text>
            <Text className="text-sm font-bold text-indigo-600 px-0.5">{partner.love_language}</Text>
          </Card>
        ) : null}

        {/* ── Birthday Card ─────────────────────────────────────────── */}
        {partner.birthday ? (
          <Card className="p-4 mb-4 border border-indigo-50/40 bg-white">
            <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">Birthday</Text>
            <Text className="text-sm font-semibold text-text-primary px-0.5">
              {formatMonthDay(partner.birthday + 'T00:00:00', 'long')}
            </Text>
          </Card>
        ) : null}

        {/* ── Stage Card ────────────────────────────────────────────── */}
        <Card className="p-4 mb-5 border border-indigo-50/40 bg-white">
          <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">Relationship Stage</Text>
          <Text className="text-sm font-semibold text-text-primary capitalize px-0.5">
            {(partner.relationship_stage || 'couples').replace('_', ' ')}
          </Text>
        </Card>

        {/* ── Bottom Routing Shortcut Tiles ─────────────────────────── */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/answers')}
            className="flex-1 p-4 rounded-2xl items-center border bg-indigo-50/20 border-indigo-100 active:bg-indigo-150"
            activeOpacity={0.8}
          >
            <AppIcon name={NAV_ICONS.session} size={22} color="#4F46E5" />
            <Text className="text-xs font-bold text-indigo-600 mt-2">Shared Answers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/dates')}
            className="flex-1 p-4 rounded-2xl items-center border bg-indigo-50/20 border-indigo-100 active:bg-indigo-150"
            activeOpacity={0.8}
          >
            <AppIcon name={NAV_ICONS.milestone} size={22} color="#4F46E5" />
            <Text className="text-xs font-bold text-indigo-600 mt-2">Important Dates</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
