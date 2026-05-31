import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { ProfileAvatar } from './ProfileAvatar';
import { useTheme } from '../lib/hooks/useTheme';
import type { Profile } from '../lib/queries/profile';

type LivePayload = {
  senderId?: string;
  action?: string;
  detail?: string;
  timestamp?: string;
};

type Props = {
  coupleId: string;
  myId: string;
  partnerProfile?: Profile | null;
};

export const LivePartnerWidget = ({ coupleId, myId, partnerProfile }: Props) => {
  const { theme } = useTheme();
  const [liveStatus, setLiveStatus] = useState<LivePayload | null>(null);

  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`live:${coupleId}`)
      .on('broadcast', { event: 'activity' }, ({ payload }) => {
        const data = payload as LivePayload;
        if (data.senderId !== myId) {
          setLiveStatus({ ...data, timestamp: new Date().toISOString() });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, myId]);

  const broadcastActivity = async (action: string, detail: string) => {
    const channel = supabase.channel(`live:${coupleId}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'activity',
      payload: { senderId: myId, action, detail, timestamp: new Date().toISOString() },
    });
    supabase.removeChannel(channel);
  };

  if (!partnerProfile) return null;

  return (
    <Card
      className="p-4 mb-5"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <View className="relative">
          <ProfileAvatar uri={partnerProfile.avatar_url} name={partnerProfile.display_name} size={48} />
          <View
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style={{ backgroundColor: liveStatus ? '#22C55E' : '#94A3B8', borderColor: theme.surface }}
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>
            Live
          </Text>
          <Text className="text-sm font-bold capitalize" style={{ color: theme.textPrimary }}>
            {partnerProfile.display_name || 'Partner'}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
            {liveStatus
              ? `${liveStatus.action}: ${liveStatus.detail}`
              : 'No recent activity — tap an action below'}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        {[
          { action: 'Playing', detail: 'a game' },
          { action: 'Listening', detail: 'to music' },
          { action: 'Writing', detail: 'an answer' },
        ].map((item) => (
          <TouchableOpacity
            key={item.action}
            onPress={() => broadcastActivity(item.action, item.detail)}
            className="flex-1 py-2 rounded-xl items-center"
            style={{ backgroundColor: theme.accentLight }}
          >
            <Text className="text-[10px] font-bold" style={{ color: theme.accent }}>
              {item.action}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};

export const broadcastLiveActivity = async (coupleId: string, myId: string, action: string, detail: string) => {
  const channel = supabase.channel(`live:${coupleId}`);
  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'activity',
          payload: { senderId: myId, action, detail, timestamp: new Date().toISOString() },
        });
        resolve();
      }
    });
  });
  supabase.removeChannel(channel);
};
