import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppIcon } from './AppIcon';
import { NAV_ICONS } from '../lib/navigationIcons';
import { getMoodTrack } from '../lib/musicTracks';
import { initMusicStoreSync, useMusicStore } from '../lib/store/musicStore';
import { useNetworkStore } from '../lib/networkStatus';

type Props = {
  moodId: string;
  customUrl?: string;
  onNowPlaying?: (title: string) => void;
};

export const MusicPlayer = ({ moodId, customUrl = '', onNowPlaying }: Props) => {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const {
    title,
    subtitle,
    isPlaying,
    isLoading,
    youtubeEmbedUrl,
    source,
    moodId: playingMoodId,
    playMood,
    playUrl,
    toggle,
  } = useMusicStore();

  useEffect(() => {
    initMusicStoreSync();
  }, []);

  useEffect(() => {
    if (onNowPlaying && title) onNowPlaying(title);
  }, [title, onNowPlaying]);

  const handlePlayMood = async () => {
    try {
      await playMood(moodId);
    } catch (err) {
      Alert.alert('Playback Failed', err instanceof Error ? err.message : 'Could not play track.');
    }
  };

  const handlePlayLink = async () => {
    if (!isOnline) {
      Alert.alert('You are offline', 'Connect to the internet to play links.');
      return;
    }
    const url = customUrl.trim();
    if (!url) {
      Alert.alert('Add a link', 'Paste a song or playlist URL first.');
      return;
    }
    try {
      await playUrl(url, 'Custom track');
    } catch (err) {
      Alert.alert('Playback Failed', err instanceof Error ? err.message : 'Could not play link.');
    }
  };

  const displayTrack = playingMoodId ? getMoodTrack(playingMoodId) : getMoodTrack(moodId);
  const showTitle = title || displayTrack.title;
  const showSubtitle = subtitle || displayTrack.artist;

  const youtubeHtml = youtubeEmbedUrl
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>*{margin:0;padding:0}body{background:#000}iframe{width:100%;height:100vh;border:0}</style></head>
<body><iframe src="${youtubeEmbedUrl}&autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></body></html>`
    : null;

  return (
    <View>
      {!isOnline ? (
        <View className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3">
          <Text className="text-xs text-emerald-950 text-center">Offline Mode — playing from local cache</Text>
        </View>
      ) : null}
      <View className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm mb-4">
        <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Now playing</Text>
        <Text className="text-lg font-bold text-text-primary">
          {source === 'youtube' ? 'YouTube video' : showTitle}
        </Text>
        {source !== 'youtube' ? (
          <Text className="text-sm text-text-secondary mt-1">{showSubtitle}</Text>
        ) : null}

        <View className="flex-row gap-3 mt-5">
          <TouchableOpacity
            onPress={() => {
              if (isPlaying && playingMoodId === moodId) {
                toggle();
              } else {
                handlePlayMood();
              }
            }}
            disabled={isLoading}
            className="flex-1 bg-primary-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppIcon name={isPlaying ? NAV_ICONS.pauseAudio : NAV_ICONS.playAudio} size={24} color="#fff" />
                <Text className="text-white font-bold text-sm">
                  {isPlaying && playingMoodId === moodId ? 'Pause' : 'Play mood'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlayLink}
            disabled={isLoading}
            className="flex-1 bg-indigo-50 border border-indigo-200 rounded-xl py-3.5 items-center justify-center"
          >
            <Text className="text-indigo-700 font-bold text-sm">Play link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {youtubeHtml && isPlaying ? (
        <View className="h-56 rounded-2xl overflow-hidden border border-neutral-border mb-4 bg-black">
          <WebView
            source={{ html: youtubeHtml }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      ) : null}
    </View>
  );
};
