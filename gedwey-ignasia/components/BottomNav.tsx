import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AppIcon } from './AppIcon';
import { NAV_ICONS, type IconName } from '../lib/navigationIcons';
import { useAuthStore } from '../lib/store/authStore';
import { useUserProfile } from '../lib/queries/profile';
import { useTheme } from '../lib/hooks/useTheme';

type Tab = { route: string; label: string; icon: IconName; iconActive: IconName };

const pairedTabs: Tab[] = [
  { route: '/', label: 'Home', icon: NAV_ICONS.home, iconActive: NAV_ICONS.homeActive },
  { route: '/games', label: 'Play', icon: NAV_ICONS.play, iconActive: NAV_ICONS.playActive },
  { route: '/journal', label: 'Journal', icon: NAV_ICONS.journal, iconActive: NAV_ICONS.journalActive },
  { route: '/cycle', label: 'Cycle', icon: NAV_ICONS.cycle, iconActive: NAV_ICONS.cycleActive },
  { route: '/settings', label: 'Profile', icon: NAV_ICONS.profile, iconActive: NAV_ICONS.profileActive },
];

const unpairedTabs: Tab[] = [
  { route: '/', label: 'Home', icon: NAV_ICONS.home, iconActive: NAV_ICONS.homeActive },
  { route: '/discovery', label: 'Discover', icon: NAV_ICONS.discovery, iconActive: NAV_ICONS.discoveryActive },
  { route: '/games', label: 'Play', icon: NAV_ICONS.play, iconActive: NAV_ICONS.playActive },
  { route: '/cycle', label: 'Cycle', icon: NAV_ICONS.cycle, iconActive: NAV_ICONS.cycleActive },
  { route: '/settings', label: 'Profile', icon: NAV_ICONS.profile, iconActive: NAV_ICONS.profileActive },
];

export const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { theme, isDark } = useTheme();
  const items = profile?.couple_id ? pairedTabs : unpairedTabs;

  return (
    <View
      className="absolute bottom-6 left-4 right-4 flex-row justify-between p-2 rounded-3xl border shadow-xl items-center"
      style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.82)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      }}
    >
      {items.map((item) => {
        const active =
          pathname === item.route || (item.route !== '/' && pathname.startsWith(item.route));
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            className="items-center justify-center rounded-2xl py-2 px-1 flex-1"
            style={{
              backgroundColor: active
                ? isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(79, 70, 229, 0.08)'
                : 'transparent',
            }}
            activeOpacity={0.8}
          >
            <AppIcon
              name={active ? item.iconActive : item.icon}
              size={20}
              color={active ? theme.accent : isDark ? '#64748B' : '#94A3B8'}
            />
            <Text
              className="text-[10px] font-semibold mt-0.5"
              style={{
                color: active ? theme.accent : isDark ? '#CBD5E1' : '#475569',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
