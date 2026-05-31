import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BottomNav } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { MusicPlayer } from '../../components/MusicPlayer';
import { ScreenShell } from '../../components/ScreenShell';
import { AppIcon } from '../../components/AppIcon';
import { NAV_ICONS } from '../../lib/navigationIcons';
import { MOOD_TRACKS, type MoodId } from '../../lib/musicTracks';
import { useAuthStore } from '../../lib/store/authStore';
import { useUserProfile } from '../../lib/queries/profile';
import { useCoupleSongs, useCreateCoupleSong } from '../../lib/queries/coupleSongs';
import { initMusicStoreSync, useMusicStore } from '../../lib/store/musicStore';

export default function MusicScreen() {
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile(user?.id ?? '');
  const { data: savedSongs = [], isLoading: songsLoading } = useCoupleSongs(profile?.couple_id ?? '');
  const createSong = useCreateCoupleSong();
  const { playMood, playUrl, moodId: playingMoodId, url: playingUrl } = useMusicStore();

  const [playlistUrl, setPlaylistUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodId>('calm');
  const [nowPlaying, setNowPlaying] = useState('');
  const [activeSongId, setActiveSongId] = useState<string | null>(null);

  useEffect(() => {
    initMusicStoreSync();
  }, []);

  const selectMood = async (moodId: MoodId) => {
    setSelectedMood(moodId);
    setActiveSongId(null);
    try {
      await playMood(moodId);
      setNowPlaying(MOOD_TRACKS.find((m) => m.id === moodId)?.title || '');
    } catch (err) {
      Alert.alert('Playback Failed', err instanceof Error ? err.message : 'Could not switch track.');
    }
  };

  const saveSong = async () => {
    if (!profile?.couple_id || !user?.id) {
      Alert.alert('Pair first', 'Connect with your partner to save shared songs.');
      return;
    }
    const url = playlistUrl.trim();
    const title = songTitle.trim() || nowPlaying || MOOD_TRACKS.find((m) => m.id === selectedMood)?.title || 'Our song';
    if (!url && !title) {
      Alert.alert('Add details', 'Paste a link or enter a song title.');
      return;
    }

    try {
      await createSong.mutateAsync({
        coupleId: profile.couple_id,
        userId: user.id,
        title,
        artist: songArtist.trim() || undefined,
        embedUrl: url || undefined,
        moodTag: selectedMood,
      });
      setSongTitle('');
      setSongArtist('');
      Alert.alert('Saved', 'Song added to your shared soundtrack.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save song.';
      Alert.alert('Save Failed', message);
    }
  };

  const openExternally = () => {
    if (!playlistUrl.trim()) {
      Alert.alert('Add a link', 'Paste a URL first.');
      return;
    }
    Linking.openURL(playlistUrl.trim()).catch(() => Alert.alert('Invalid link', 'Could not open that URL.'));
  };

  const playSavedSong = async (songId: string, url: string | null, title: string) => {
    if (!url) {
      Alert.alert('No link', 'This song has no playable URL saved.');
      return;
    }
    setActiveSongId(songId);
    try {
      await playUrl(url, title, songArtist || 'Saved song');
      setNowPlaying(title);
    } catch (err) {
      Alert.alert('Playback Failed', err instanceof Error ? err.message : 'Could not play song.');
    }
  };

  return (
    <ScreenShell variant="hero" className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 112 }}>
        <View className="flex-row items-center gap-3 mb-2">
          <AppIcon name={NAV_ICONS.musicActive} size={28} color="#4F46E5" />
          <Text className="text-2xl font-bold text-text-primary">Our Soundtrack</Text>
        </View>
        <Text className="text-sm text-text-secondary mb-5">Tap a mood or saved song — it switches instantly.</Text>

        <MusicPlayer moodId={selectedMood} customUrl={playlistUrl} onNowPlaying={setNowPlaying} />

        <Card className="p-5 mb-5 border border-violet-100 bg-violet-50/30">
          <Text className="text-sm font-bold text-violet-700 uppercase tracking-widest mb-2">Mood radio</Text>
          <Text className="text-base text-text-secondary mb-4">
            {MOOD_TRACKS.find((m) => m.id === selectedMood)?.emoji}{' '}
            {MOOD_TRACKS.find((m) => m.id === selectedMood)?.title}
            {playingMoodId === selectedMood ? ' · playing' : ''}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MOOD_TRACKS.map((mood) => {
              const active = selectedMood === mood.id || playingMoodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => selectMood(mood.id)}
                  className={`px-3 py-2.5 rounded-xl border min-w-[30%] flex-grow items-center ${
                    active ? 'bg-violet-600 border-violet-600' : 'bg-white border-neutral-border'
                  }`}
                >
                  <Text className="text-base mb-0.5">{mood.emoji}</Text>
                  <Text className={`text-[10px] font-bold capitalize ${active ? 'text-white' : 'text-text-secondary'}`}>
                    {mood.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card className="p-5 mb-5">
          <Input label="Song title" placeholder="e.g. Our song" value={songTitle} onChangeText={setSongTitle} />
          <Input label="Artist (optional)" placeholder="Artist name" value={songArtist} onChangeText={setSongArtist} />
          <Input
            label="Playlist or song link"
            placeholder="YouTube, .mp3, Spotify share link"
            autoCapitalize="none"
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
          />
          <View className="flex-row gap-3 mt-1">
            <TouchableOpacity
              onPress={openExternally}
              className="flex-1 bg-white border border-indigo-100 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <AppIcon name={NAV_ICONS.link} size={16} color="#4F46E5" />
              <Text className="text-xs font-bold text-indigo-600">Open externally</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Button title="Save song" onPress={saveSong} loading={createSong.isPending} />
            </View>
          </View>
        </Card>

        <Card className="p-5">
          <Text className="text-sm font-bold text-text-primary mb-3">Saved songs</Text>
          {songsLoading ? (
            <Text className="text-sm text-text-secondary">Loading...</Text>
          ) : savedSongs.length === 0 ? (
            <Text className="text-sm text-text-secondary">No saved songs yet. Add your first track above.</Text>
          ) : (
            savedSongs.map((song) => {
              const isActive = activeSongId === song.id || playingUrl === song.embed_url;
              return (
                <TouchableOpacity
                  key={song.id}
                  onPress={() => playSavedSong(song.id, song.embed_url, song.title)}
                  className={`flex-row items-center justify-between py-3 border-b border-slate-100 px-2 -mx-2 rounded-xl ${
                    isActive ? 'bg-indigo-50' : ''
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-text-primary'}`}>
                      {song.title}
                    </Text>
                    {song.artist ? <Text className="text-xs text-text-secondary">{song.artist}</Text> : null}
                    {isActive ? (
                      <Text className="text-[10px] font-bold text-indigo-600 mt-1">Now playing</Text>
                    ) : null}
                  </View>
                  <View className="bg-primary-600 px-3 py-2 rounded-xl flex-row items-center gap-1">
                    <AppIcon name={isActive ? NAV_ICONS.pauseAudio : NAV_ICONS.playAudio} size={14} color="#fff" />
                    <Text className="text-xs font-bold text-white">{isActive ? 'Playing' : 'Play'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Card>
      </ScrollView>
      <BottomNav />
    </ScreenShell>
  );
}
