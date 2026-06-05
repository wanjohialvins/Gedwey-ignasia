import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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
            <AppIcon name={NAV_ICONS.musicActive} size={22} color="#4F46E5" />
            <Text className="text-lg font-extrabold text-text-primary">Our Soundtrack</Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="text-xs text-text-secondary leading-relaxed mb-5 px-1">
          Select or stream ambient loops and save your special couple tracks.
        </Text>

        {/* ── Music Player Visual Widget ────────────────────────────── */}
        <MusicPlayer moodId={selectedMood} customUrl={playlistUrl} onNowPlaying={setNowPlaying} />

        {/* ── Ambient Mood Radio ────────────────────────────────────── */}
        <Card className="p-4 mt-5 mb-5 border border-indigo-50/40 bg-white">
          <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">Select Ambient Radio Mood</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {MOOD_TRACKS.map((mood) => {
              const active = selectedMood === mood.id || playingMoodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => selectMood(mood.id)}
                  className={`py-3.5 rounded-xl border flex-1 min-w-[28%] items-center active:opacity-85 ${
                    active ? 'bg-primary-600 border-primary-600 shadow-md shadow-primary-600/10' : 'bg-slate-50/50 border-indigo-50/60'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-xl mb-1">{mood.emoji}</Text>
                  <Text className={`text-[10px] font-extrabold capitalize ${active ? 'text-white' : 'text-text-secondary'}`}>
                    {mood.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── Save Custom Tracks Form ──────────────────────────────── */}
        <Card className="p-4 mb-5 border border-indigo-50/40 bg-white">
          <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">Save Shared Track Link</Text>
          <Input label="Song Title" placeholder="e.g. Our favorite melody" value={songTitle} onChangeText={setSongTitle} />
          <Input label="Artist" placeholder="e.g. Acoustic artist" value={songArtist} onChangeText={setSongArtist} />
          <Input
            label="Streaming link / URL"
            placeholder="YouTube, Spotify or public mp3 link"
            autoCapitalize="none"
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
            className="mb-2"
          />
          <View className="flex-row gap-3 mt-1.5">
            <TouchableOpacity
              onPress={openExternally}
              className="flex-1 bg-white border border-indigo-100 rounded-xl py-3 flex-row items-center justify-center gap-2 active:bg-slate-50"
            >
              <AppIcon name={NAV_ICONS.link} size={15} color="#4F46E5" />
              <Text className="text-xs font-bold text-indigo-600">Open Link</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Button title="Save Soundtrack" onPress={saveSong} loading={createSong.isPending} />
            </View>
          </View>
        </Card>

        {/* ── Saved Tracks List ─────────────────────────────────────── */}
        <Card className="p-4 mb-5 border border-indigo-50/40 bg-white">
          <Text className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">Our Shared Soundtrack Archive</Text>
          {songsLoading ? (
            <Text className="text-xs text-text-secondary italic">Loading soundtracks...</Text>
          ) : savedSongs.length === 0 ? (
            <Text className="text-2xs text-text-secondary font-semibold italic text-center py-4">No saved songs yet. Add your first track above.</Text>
          ) : (
            savedSongs.map((song) => {
              const isActive = activeSongId === song.id || playingUrl === song.embed_url;
              return (
                <TouchableOpacity
                  key={song.id}
                  onPress={() => playSavedSong(song.id, song.embed_url, song.title)}
                  className={`flex-row items-center justify-between py-3 border-b border-slate-100/60 px-2 -mx-2 rounded-xl active:bg-slate-50 ${
                    isActive ? 'bg-indigo-50/30' : ''
                  }`}
                  activeOpacity={0.8}
                >
                  <View className="flex-1 pr-3">
                    <Text className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-text-primary'}`}>
                      {song.title}
                    </Text>
                    {song.artist ? <Text className="text-xs text-text-secondary mt-0.5">{song.artist}</Text> : null}
                    {isActive ? (
                      <Text className="text-[9px] font-extrabold text-indigo-600 mt-1 uppercase tracking-wide">Playing Loop</Text>
                    ) : null}
                  </View>
                  <View className="bg-primary-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 active:bg-primary-500">
                    <AppIcon name={isActive ? NAV_ICONS.pauseAudio : NAV_ICONS.playAudio} size={12} color="#fff" />
                    <Text className="text-2xs font-extrabold text-white uppercase tracking-wider">{isActive ? 'Pause' : 'Play'}</Text>
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
