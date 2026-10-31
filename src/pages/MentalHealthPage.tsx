import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';

interface MentalEntry {
  id: string;
  date: string;
  mood: string;
  notes: string;
  stressLevel: number;
  timestamp: number;
}

const moodSupportMap: Record<string, { emoji: string; title: string; suggestions: string[] }> = {
  Calm: {
    emoji: '😌',
    title: 'You are doing well',
    suggestions: ['Take a slow walk', 'Play a calming playlist', 'Do a 10-minute stretch'],
  },
  Sad: {
    emoji: '😢',
    title: 'A gentle day is still a good day',
    suggestions: ['Watch a comforting movie', 'Call a trusted friend', 'Write down one happy memory'],
  },
  Anxious: {
    emoji: '😰',
    title: 'You can soften the moment',
    suggestions: ['Try deep breathing for 3 minutes', 'Listen to relaxing music', 'Step outside for fresh air'],
  },
  Angry: {
    emoji: '😠',
    title: 'Let the feeling pass',
    suggestions: ['Take a short walk', 'Do a light workout', 'Journal what is bothering you'],
  },
  Tired: {
    emoji: '😴',
    title: 'Rest is part of progress',
    suggestions: ['Have a warm shower', 'Listen to soft music', 'Take a power nap if possible'],
  },
  Happy: {
    emoji: '😊',
    title: 'Keep that energy flowing',
    suggestions: ['Do one productive task', 'Share your mood with someone', 'Celebrate your small win'],
  },
  Focused: {
    emoji: '🧠',
    title: 'You are in the zone',
    suggestions: ['Keep the momentum going', 'Take a break when needed', 'Celebrate your focus'],
  },
  Grateful: {
    emoji: '🙏',
    title: 'Hold onto this feeling',
    suggestions: ['Share gratitude with others', 'Journal three things you appreciate', 'Pay it forward'],
  },
};

interface MentalHealthPageProps {
  currentUser: string;
}

function storageKey(user: string) {
  return `one-wish-${user}-mental-health`;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getMoodEmoji(mood: string): string {
  const moodKey = Object.keys(moodSupportMap).find((key) => key.toLowerCase() === mood.toLowerCase());
  return moodKey ? moodSupportMap[moodKey].emoji : '🌟';
}

function loadMentalEntries(user: string): MentalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function MentalHealthPage({ currentUser }: MentalHealthPageProps) {
  const [mood, setMood] = useState('Calm');
  const [stressLevel, setStressLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<MentalEntry[]>(() => loadMentalEntries(currentUser));

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(entries));
  }, [entries, currentUser]);

  const averageStress = useMemo(() => {
    if (!entries.length) return 0;
    return Math.round(entries.reduce((sum, entry) => sum + entry.stressLevel, 0) / entries.length);
  }, [entries]);

  const moodSupport = moodSupportMap[mood] || moodSupportMap.Calm;

  function addEntry() {
    const newEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      mood: mood.trim() || 'Stable',
      stressLevel,
      notes: notes.trim(),
      timestamp: Date.now(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setNotes('');
    setStressLevel(3);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  return (
    <section className="page-card mental-health-page">
      <div className="page-header">
        <div>
          <PageTitle topic="mental-health"><h2>Mental Health Check-in</h2></PageTitle>
          <p>Log your mood and stress levels. Small steps lead to big changes.</p>
        </div>
        <PageIllustration topic="mental-health" />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Check-ins</span>
          <strong>{entries.length}</strong>
        </div>
        <div className="stat-card">
          <span>Avg Stress</span>
          <div className="stress-mini-bar">
            <div className="stress-mini-fill" style={{ width: `${(averageStress / 10) * 100}%` }}></div>
          </div>
          <strong>{averageStress}/10</strong>
        </div>
        <div className="stat-card">
          <span>Current Mood</span>
          <strong>{entries[0]?.mood ? `${getMoodEmoji(entries[0].mood)} ${entries[0].mood}` : '—'}</strong>
        </div>
      </div>

      <div className="support-card">
        <div className="support-header">
          <span className="support-emoji">{moodSupportMap[mood]?.emoji || '🌟'}</span>
          <h3>{moodSupportMap[mood]?.title || 'Keep going'}</h3>
        </div>
        <p>Here are some gentle ideas to support you:</p>
        <div className="suggestions-grid">
          {moodSupportMap[mood]?.suggestions.map((suggestion) => (
            <div key={suggestion} className="suggestion-pill">
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      <div className="quick-moods">
        <p className="quick-moods-label">Quick select:</p>
        <div className="mood-buttons">
          {Object.entries(moodSupportMap).map(([moodName, moodData]) => (
            <button
              key={moodName}
              className={`mood-btn ${mood === moodName ? 'active' : ''}`}
              onClick={() => setMood(moodName)}
              type="button"
              title={moodName}
            >
              <span className="mood-emoji">{moodData.emoji}</span>
              <span className="mood-label">{moodName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-form">
        <label>Stress Level: <strong>{stressLevel}/10</strong></label>
        <input type="range" min="1" max="10" value={stressLevel} onChange={(event) => setStressLevel(Number(event.target.value))} className="stress-slider" />
        <div className="stress-labels">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
        <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Share your thoughts, feelings, or coping ideas..." className="mental-notes-textarea" />
        <button className="full-width" onClick={addEntry} type="button">✓ Save Check-in</button>
      </div>

      <div className="event-list">
        {entries.length ? (
          entries.map((entry) => (
            <article key={entry.id} className="mental-entry-card">
              <div className="entry-header">
                <div className="entry-mood">
                  <span className="large-emoji">{getMoodEmoji(entry.mood)}</span>
                  <div className="entry-title">
                    <h4>{entry.mood}</h4>
                    <p className="entry-meta">{entry.date} at {formatTime(entry.timestamp)}</p>
                  </div>
                </div>
                <button className="delete-button small" onClick={() => removeEntry(entry.id)} type="button">✕</button>
              </div>
              <div className="entry-stress">
                <div className="stress-bar">
                  <div className="stress-fill" style={{ width: `${(entry.stressLevel / 10) * 100}%` }}></div>
                </div>
                <span className="stress-text">Stress: {entry.stressLevel}/10</span>
              </div>
              {entry.notes && <p className="entry-notes">{entry.notes}</p>}
            </article>
          ))
        ) : (
          <p className="empty-state">No check-ins yet. Start by recording how you feel today.</p>
        )}
      </div>
    </section>
  );
}
