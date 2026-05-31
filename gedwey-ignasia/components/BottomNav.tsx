import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AppIcon } from './AppIcon';
import { NAV_ICONS, type IconName } from '../lib/navigationIcons';
import { useAuthStore } from '../lib/store/authStore';
import { useUserProfile } from '../lib/queries/profile';

type Tab = { route: string; label: string; icon: IconName; iconActive: IconName };

const pairedTabs: Tab[] = [
  { route: '/', label: 'Home', icon: NAV_ICONS.home, iconActive: NAV_ICONS.homeActive },
  { route: '/games', label: 'Play', icon: NAV_ICONS.play, iconActive: NAV_ICONS.playActive },
  { route: '/journal', label: 'Journal', icon: NAV_ICONS.journal, iconActive: NAV_ICONS.journalActive },
  { route: '/music', label: 'Music', icon: NAV_ICONS.music, iconActive: NAV_ICONS.musicActive },
  { route: '/settings', label: 'Profile', icon: NAV_ICONS.profile, iconActive: NAV_ICONS.profileActive },
];

const unpairedTabs: Tab[] = [
  { route: '/', label: 'Home', icon: NAV_ICONS.home, iconActive: NAV_ICONS.homeActive },
  { route: '/discovery', label: 'Discover', icon: NAV_ICONS.discovery, iconActive: NAV_ICONS.discoveryActive },
  { route: '/games', label: 'Play', icon: NAV_ICONS.play, iconActive: NAV_ICONS.playActive },
  { route: '/music', label: 'Music', icon: NAV_ICONS.music, iconActive: NAV_ICONS.musicActive },
  { route: '/settings', label: 'Profile', icon: NAV_ICONS.profile, iconActive: NAV_ICONS.profileActive },
];

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const items = profile?.couple_id ? pairedTabs : unpairedTabs;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-indigo-100 px-2 pt-2 pb-4 flex-row justify-between shadow-lg">
      {items.map((item) => {
        const active =
          pathname === item.route || (item.route !== '/' && pathname.startsWith(item.route));
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            className={`items-center justify-center rounded-2xl py-2 px-1.5 min-w-[58px] flex-1 ${active ? 'bg-indigo-50' : ''}`}
            activeOpacity={0.8}
          >
            <AppIcon name={active ? item.iconActive : item.icon} size={22} color={active ? '#4F46E5' : '#94A3B8'} />
            <Text className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-indigo-600' : 'text-text-secondary'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
