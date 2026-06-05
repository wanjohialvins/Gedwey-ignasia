import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export const NAV_ICONS = {
  home: 'home-outline' as IconName,
  homeActive: 'home' as IconName,
  play: 'game-controller-outline' as IconName,
  playActive: 'game-controller' as IconName,
  journal: 'book-outline' as IconName,
  journalActive: 'book' as IconName,
  music: 'musical-notes-outline' as IconName,
  musicActive: 'musical-notes' as IconName,
  profile: 'person-outline' as IconName,
  profileActive: 'person' as IconName,
  discovery: 'sparkles-outline' as IconName,
  discoveryActive: 'sparkles' as IconName,
  menu: 'menu-outline' as IconName,
  settings: 'settings-outline' as IconName,
  close: 'close' as IconName,
  nudge: 'heart' as IconName,
  session: 'chatbubbles-outline' as IconName,
  games: 'dice-outline' as IconName,
  lists: 'checkbox-outline' as IconName,
  bucket: 'earth-outline' as IconName,
  history: 'time-outline' as IconName,
  capsule: 'hourglass-outline' as IconName,
  health: 'pulse-outline' as IconName,
  dashboard: 'grid-outline' as IconName,
  streak: 'flame-outline' as IconName,
  partner: 'people-outline' as IconName,
  milestone: 'trophy-outline' as IconName,
  chevron: 'chevron-forward' as IconName,
  playAudio: 'play-circle' as IconName,
  pauseAudio: 'pause-circle' as IconName,
  link: 'link-outline' as IconName,
};

export const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: NAV_ICONS.dashboard, label: 'Dashboard', detail: 'Home summary', route: '/' },
  { key: 'discovery', icon: NAV_ICONS.discovery, label: 'Discovery Mode', detail: 'Share and compare answers', route: '/discovery', unpairedOnly: true },
  { key: 'session', icon: NAV_ICONS.session, label: 'Daily Question', detail: 'Daily question cards', route: '/session/start', requiresPair: true },
  { key: 'games', icon: NAV_ICONS.games, label: 'Games', detail: 'Truth or Dare and more', route: '/games' },
  { key: 'lists', icon: NAV_ICONS.lists, label: 'Shared Lists', detail: 'To-dos and bucket goals', route: '/lists' },
  { key: 'music', icon: NAV_ICONS.music, label: 'Music', detail: 'Our soundtrack', route: '/music' },
  { key: 'history', icon: NAV_ICONS.history, label: 'History', detail: 'Activity timeline', route: '/history' },
  { key: 'journal', icon: NAV_ICONS.journal, label: 'Shared Journal', detail: 'Private memories', route: '/journal', milestone: 5 },
  { key: 'capsule', icon: NAV_ICONS.capsule, label: 'Time Capsules', detail: 'Future memories', route: '/capsule', requiresPair: true },
  { key: 'health', icon: NAV_ICONS.health, label: 'Relationship Health', detail: 'Weekly alignment', route: '/health', milestone: 10 },
  { key: 'settings', icon: NAV_ICONS.settings, label: 'Settings', detail: 'Profile and preferences', route: '/settings' },
] as const;

export const QUICK_TILES = [
  { key: 'answers', icon: NAV_ICONS.session, label: 'All answers', route: '/answers', requiresPair: true, color: 'bg-indigo-100', iconColor: '#4F46E5' },
  { key: 'games', icon: NAV_ICONS.games, label: 'Play a game', route: '/games', color: 'bg-violet-100', iconColor: '#7C3AED' },
  { key: 'todo', icon: NAV_ICONS.lists, label: 'To-do list', route: '/lists', params: { tab: 'todo' }, color: 'bg-sky-100', iconColor: '#0284C7' },
  { key: 'bucket', icon: NAV_ICONS.bucket, label: 'Bucket list', route: '/lists', params: { tab: 'bucket' }, color: 'bg-emerald-100', iconColor: '#059669' },
  { key: 'history', icon: NAV_ICONS.history, label: 'History', route: '/history', color: 'bg-amber-100', iconColor: '#D97706' },
  { key: 'capsule', icon: NAV_ICONS.capsule, label: 'Time capsule', route: '/capsule', requiresPair: true, color: 'bg-rose-100', iconColor: '#E11D48' },
  { key: 'health', icon: NAV_ICONS.health, label: 'Health check-in', route: '/health', milestone: 10, color: 'bg-fuchsia-100', iconColor: '#C026D3' },
] as const;
