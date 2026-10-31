import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';

const providers = ['Spotify', 'Apple Music', 'Gaana', 'Jio Saavn'] as const;

type MusicProvider = (typeof providers)[number];

interface PlaylistItem {
  id: string;
  provider: MusicProvider;
  title: string;
  mood: string;
}

interface SuggestedTrack {
  title: string;
  mood: string;
  provider: MusicProvider;
}

interface MusicPageProps {
  currentUser: string;
}

const providerLoginUrls: Record<MusicProvider, string> = {
  Spotify: 'https://open.spotify.com/',
  'Apple Music': 'https://music.apple.com/',
  Gaana: 'https://gaana.com/',
  'Jio Saavn': 'https://www.jiosaavn.com/',
};

const providerSearchUrls: Record<MusicProvider, (query: string) => string> = {
  Spotify: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
  'Apple Music': (query) => `https://music.apple.com/search?term=${encodeURIComponent(query)}`,
  Gaana: (query) => `https://gaana.com/search/${encodeURIComponent(query)}`,
  'Jio Saavn': (query) => `https://www.jiosaavn.com/search/${encodeURIComponent(query)}`,
};

function storageKey(user: string) {
  return `one-wish-${user}-music`;
}

function providerStorageKey(user: string) {
  return `one-wish-${user}-music-providers`;
}

function recentStorageKey(user: string) {
  return `one-wish-${user}-music-recent`;
}

function loadPlaylists(user: string): PlaylistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadConnectedProviders(user: string): MusicProvider[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(providerStorageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadRecentPlays(user: string): PlaylistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(recentStorageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function MusicPage({ currentUser }: MusicPageProps) {
  const [playlistTitle, setPlaylistTitle] = useState('Morning focus');
  const [provider, setProvider] = useState<MusicProvider>('Spotify');
  const [mood, setMood] = useState('Motivated');
  const [playlists, setPlaylists] = useState<PlaylistItem[]>(() => loadPlaylists(currentUser));
  const [connectedProviders, setConnectedProviders] = useState<MusicProvider[]>(() => loadConnectedProviders(currentUser));
  const [recentPlays, setRecentPlays] = useState<PlaylistItem[]>(() => loadRecentPlays(currentUser));
  const [nowPlaying, setNowPlaying] = useState<PlaylistItem | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(playlists));
  }, [playlists, currentUser]);

  useEffect(() => {
    window.localStorage.setItem(providerStorageKey(currentUser), JSON.stringify(connectedProviders));
  }, [connectedProviders, currentUser]);

  useEffect(() => {
    window.localStorage.setItem(recentStorageKey(currentUser), JSON.stringify(recentPlays));
  }, [recentPlays, currentUser]);

  const providerCounts = useMemo(() => {
    return playlists.reduce<Record<MusicProvider, number>>((acc, item) => {
      acc[item.provider] = (acc[item.provider] ?? 0) + 1;
      return acc;
    }, { Spotify: 0, 'Apple Music': 0, Gaana: 0, 'Jio Saavn': 0 });
  }, [playlists]);

  function addPlaylist() {
    if (!playlistTitle.trim()) return;
    const newPlaylist = {
      id: crypto.randomUUID(),
      provider,
      title: playlistTitle.trim(),
      mood: mood.trim() || 'Anytime',
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setPlaylistTitle('');
    setMood('Motivated');
  }

  function removePlaylist(id: string) {
    setPlaylists((prev) => prev.filter((item) => item.id !== id));
  }

  function connectProvider(nextProvider: MusicProvider) {
    if (typeof window !== 'undefined') {
      window.open(providerLoginUrls[nextProvider], '_blank', 'noopener,noreferrer');
    }
    setConnectedProviders((prev) => (prev.includes(nextProvider) ? prev : [...prev, nextProvider]));
  }

  function playMusic(item: PlaylistItem) {
    if (typeof window === 'undefined') return;
    const targetUrl = providerSearchUrls[item.provider](item.title);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setNowPlaying(item);
    setRecentPlays((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)].slice(0, 4));
  }

  const moodSuggestions = useMemo<SuggestedTrack[]>(() => {
    const normalizedMood = mood.toLowerCase();
    if (normalizedMood.includes('calm') || normalizedMood.includes('sleep') || normalizedMood.includes('focus')) {
      return [
        { title: 'Lo-fi Study Beats', mood: 'Calm focus', provider: 'Spotify' },
        { title: 'Soft instrumental', mood: 'Relaxed', provider: 'Apple Music' },
      ];
    }
    if (normalizedMood.includes('energy') || normalizedMood.includes('motiv')) {
      return [
        { title: 'Workout energy mix', mood: 'Motivation', provider: 'Spotify' },
        { title: 'High energy pop', mood: 'Drive', provider: 'Gaana' },
      ];
    }
    return [
      { title: 'Mood lift playlist', mood: 'Feel good', provider: 'Jio Saavn' },
      { title: 'Golden hour mix', mood: 'Chill', provider: 'Apple Music' },
    ];
  }, [mood]);

  return (
    <section className="page-card music-page">
      <div className="page-header">
        <div>
          <PageTitle topic="music"><h2>Music Hub</h2></PageTitle>
          <p>Connect to your favorite music service and keep playlists and moods close to your routine.</p>
        </div>
        <PageIllustration topic="music" />
      </div>

      <div className="stats-row">
        {providers.map((option) => (
          <div key={option} className="stat-card">
            <span>{option}</span>
            <strong>{providerCounts[option]}</strong>
          </div>
        ))}
      </div>

      <div className="provider-connect-grid">
        {providers.map((option) => {
          const isConnected = connectedProviders.includes(option);
          return (
            <article key={option} className="provider-card">
              <div>
                <h3>{option}</h3>
                <p>{isConnected ? 'Signed in and ready for your next vibe.' : 'Open the official sign-in page to connect your account.'}</p>
              </div>
              <button onClick={() => connectProvider(option)} type="button">
                {isConnected ? 'Open sign-in' : 'Connect'}
              </button>
            </article>
          );
        })}
      </div>

      {nowPlaying ? (
        <div className="now-playing-card">
          <div>
            <p className="now-playing-label">Now playing</p>
            <h3>{nowPlaying.title}</h3>
            <p>{nowPlaying.provider} • {nowPlaying.mood}</p>
          </div>
          <button className="full-width" onClick={() => playMusic(nowPlaying)} type="button">Open in provider</button>
        </div>
      ) : null}

      <div className="mini-player-bar">
        <div>
          <strong>{nowPlaying ? nowPlaying.title : 'Pick a mood and start listening'}</strong>
          <p>{nowPlaying ? `${nowPlaying.provider} • ${nowPlaying.mood}` : 'Suggestions update with your current mood.'}</p>
        </div>
        <button onClick={() => nowPlaying && playMusic(nowPlaying)} type="button">Play now</button>
      </div>

      <div className="suggestion-grid">
        {moodSuggestions.map((item) => (
          <article key={item.title} className="suggestion-card">
            <h4>{item.title}</h4>
            <p>{item.mood}</p>
            <button onClick={() => playMusic({ id: item.title, provider: item.provider, title: item.title, mood: item.mood })} type="button">Queue</button>
          </article>
        ))}
      </div>

      {recentPlays.length ? (
        <div className="recent-list">
          <h3>Recently played</h3>
          {recentPlays.map((item) => (
            <div key={`${item.id}-${item.title}`} className="recent-item">
              <span>{item.title}</span>
              <small>{item.provider}</small>
            </div>
          ))}
        </div>
      ) : null}

      <div className="calendar-form">
        <input value={playlistTitle} onChange={(event) => setPlaylistTitle(event.target.value)} placeholder="Playlist or track name" />
        <select value={provider} onChange={(event) => setProvider(event.target.value as MusicProvider)}>
          {providers.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Mood or theme" />
        <button className="full-width" onClick={addPlaylist} type="button">Add music item</button>
      </div>

      <div className="event-list">
        {playlists.length ? (
          playlists.map((item) => (
            <article key={item.id} className="event-card">
              <div className="event-card-heading">
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.provider} • {item.mood}</p>
                </div>
                <div className="music-actions">
                  <button className="delete-button" onClick={() => playMusic(item)} type="button">Play</button>
                  <button className="delete-button" onClick={() => removePlaylist(item.id)} type="button">Remove</button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No music entries yet. Add a playlist or track to keep the vibe going.</p>
        )}
      </div>
    </section>
  );
}
