import { useEffect, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';

interface AddictionEntry {
  id: string;
  date: string;
  habit: string;
  trigger: string;
  progress: string;
  timestamp: number;
}

const addictionSupportMap: Record<string, { emoji: string; title: string; suggestions: string[]; resources?: string[] }> = {
  'Screen time': {
    emoji: '📱',
    title: 'Screen time support',
    suggestions: ['Set app limits for 24 hours', 'Keep your phone out of reach during meals', 'Replace scrolling with a short walk or stretch'],
    resources: ['Use built-in app limits (iOS Screen Time, Android Digital Wellbeing)', 'Apps: Freedom, Cold Turkey, Forest', 'Tech-free zones: bedroom, dining table, first 1 hour after waking'],
  },
  Alcohol: {
    emoji: '🍷',
    title: 'Alcohol support',
    suggestions: ['Avoid triggers like bars or late-night scrolling', 'Drink water and keep a distraction ready', 'Reach out to a trusted friend or support group'],
    resources: ['Crisis: SAMHSA National Helpline 1-800-662-4357 (free, confidential)', 'Support: AA (Alcoholics Anonymous), SMART Recovery', 'Recovery app: I Am Sober tracks days without alcohol'],
  },
  Smoking: {
    emoji: '🚬',
    title: 'Smoking support',
    suggestions: ['Keep gum or mints nearby', 'Take deep breaths when cravings hit', 'Track each craving and note what triggered it'],
    resources: ['Free: 1-800-QUIT-NOW (1-800-784-8669)', 'Nicotine replacement: patches, gum, lozenges', 'Apps: QuitGuide, Smoke Free help track progress'],
  },
  Gaming: {
    emoji: '🎮',
    title: 'Gaming support',
    suggestions: ['Set a timer before you play', 'Create a screen-free evening routine', 'Do a quick workout or outdoor activity after gaming'],
    resources: ['Online Gamers Anonymous 12-step support', 'Therapy: Search for gaming addiction specialists', 'Replace with: exercise, hobbies, time with friends'],
  },
  'Sugar cravings': {
    emoji: '🍬',
    title: 'Sugar cravings support',
    suggestions: ['Choose fruit or nuts instead of sugary snacks', 'Drink water first when cravings appear', 'Keep your meals balanced and filling'],
    resources: ['Blood sugar management: eat protein at every meal', 'Hydration: often thirst masks as hunger', 'Gradual reduction prevents withdrawal headaches'],
  },
  'Caffeine': {
    emoji: '☕',
    title: 'Caffeine reduction support',
    suggestions: ['Gradually reduce intake over 2 weeks', 'Switch to decaf or herbal tea', 'Stay hydrated and get good sleep'],
    resources: ['Mix caffeinated and decaf coffee gradually', 'Herbal teas: chamomile, peppermint, rooibos', 'Exercise helps counter fatigue during reduction'],
  },
  'Social media': {
    emoji: '📲',
    title: 'Social media support',
    suggestions: ['Delete apps from your home screen', 'Use app blockers during work hours', 'Replace browsing with a hobby'],
    resources: ['Apps: Freedom, Cold Turkey block distracting sites', 'Browser: News Feed Eradicator hides social feeds', 'Community: Dopamine Detox groups for support'],
  },
  'Shopping': {
    emoji: '🛍️',
    title: 'Impulse shopping support',
    suggestions: ['Wait 48 hours before buying', 'Track every purchase in a journal', 'Unsubscribe from marketing emails'],
    resources: ['Delete saved payment methods from browsers', 'Unsubscribe from promotional emails', 'Financial therapy: address underlying emotional needs'],
  },
};

const recoveryAffirmations = [
  '🌟 You are stronger than your cravings.',
  '💪 Each day is a new opportunity to choose yourself.',
  '🎯 Progress, not perfection. You are doing amazing.',
  '🌈 Recovery is a journey, not a destination. Celebrate small wins.',
  '✨ Your future self thanks you for fighting today.',
  '🌱 Change happens one choice at a time. You\'ve got this.',
  '❤️ You deserve a healthy, fulfilling life.',
  '🚀 Every moment is a chance to start fresh.',
];

interface AddictionHelpPageProps {
  currentUser: string;
}

function storageKey(user: string) {
  return `one-wish-${user}-addiction-help`;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getHabitEmoji(habit: string): string {
  const habitKey = Object.keys(addictionSupportMap).find((key) => key.toLowerCase() === habit.toLowerCase());
  return habitKey ? addictionSupportMap[habitKey].emoji : '💪';
}

function loadEntries(user: string): AddictionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function AddictionHelpPage({ currentUser }: AddictionHelpPageProps) {
  const [habit, setHabit] = useState('Screen time');
  const [trigger, setTrigger] = useState('Boredom');
  const [progress, setProgress] = useState('Reduced by one hour');
  const [entries, setEntries] = useState<AddictionEntry[]>(() => loadEntries(currentUser));  const [affirmationIndex, setAffirmationIndex] = useState(Math.floor(Math.random() * recoveryAffirmations.length));  const supportPlan = addictionSupportMap[habit] || addictionSupportMap['Screen time'];

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(entries));
  }, [entries, currentUser]);

  function addEntry() {
    if (!habit.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      habit: habit.trim(),
      trigger: trigger.trim() || 'Unknown',
      progress: progress.trim() || 'In progress',
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev]);
    setProgress('Improved');
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  return (
    <section className="page-card addiction-page">
      <div className="page-header">
        <div>
          <PageTitle topic="recovery"><h2>Addiction Recovery</h2></PageTitle>
          <p>Break unhealthy habits with support and progress tracking. You've got this!</p>
        </div>
        <PageIllustration topic="recovery" />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Log Entries</span>
          <strong>{entries.length}</strong>
        </div>
        <div className="stat-card">
          <span>Current Focus</span>
          <strong>{entries[0]?.habit ? `${getHabitEmoji(entries[0].habit)} ${entries[0].habit}` : '—'}</strong>
        </div>
        <div className="stat-card">
          <span>Unique Habits</span>
          <strong>{new Set(entries.map((e) => e.habit)).size}</strong>
        </div>
      </div>

      <div className="support-card">
        <div className="support-header">
          <span className="support-emoji">{addictionSupportMap[habit]?.emoji || '💪'}</span>
          <h3>{addictionSupportMap[habit]?.title || 'Keep going'}</h3>
        </div>
        <p>Here are supportive steps for this habit:</p>
        <div className="suggestions-grid">
          {addictionSupportMap[habit]?.suggestions.map((suggestion) => (
            <div key={suggestion} className="suggestion-pill">
              {suggestion}
            </div>
          ))}
        </div>
      </div>

      <div className="affirmation-card">
        <p className="affirmation-text">{recoveryAffirmations[affirmationIndex]}</p>
        <button className="affirmation-btn" onClick={() => setAffirmationIndex((Math.random() * recoveryAffirmations.length) | 0)} type="button">
          New affirmation
        </button>
      </div>

      {supportPlan.resources && (
        <div className="resources-card">
          <h3>📚 Recovery Resources</h3>
          <div className="resources-list">
            {supportPlan.resources.map((resource) => (
              <div key={resource} className="resource-item">
                <span className="resource-icon">→</span>
                <span className="resource-text">{resource}</span>
              </div>
            ))}
          </div>
          <p className="resources-note">💡 Professional help is available. You don't have to do this alone.</p>
        </div>
      )}

      <div className="quick-habits">
        <p className="quick-habits-label">Quick select a habit:</p>
        <div className="habit-buttons">
          {Object.entries(addictionSupportMap).map(([habitName, habitData]) => (
            <button
              key={habitName}
              className={`habit-btn ${habit === habitName ? 'active' : ''}`}
              onClick={() => setHabit(habitName)}
              type="button"
              title={habitName}
            >
              <span className="habit-emoji">{habitData.emoji}</span>
              <span className="habit-label">{habitName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-form">
        <label>Trigger or Cue:</label>
        <input value={trigger} onChange={(event) => setTrigger(event.target.value)} placeholder="What triggered this? (e.g., stress, boredom, social)" />
        <label>Progress Note:</label>
        <input value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="How did you handle it? (e.g., resisted, partial, struggled)" />
        <button className="full-width" onClick={addEntry} type="button">✓ Log Recovery Entry</button>
      </div>

      <div className="event-list">
        {entries.length ? (
          entries.map((entry) => (
            <article key={entry.id} className="addiction-entry-card">
              <div className="entry-header">
                <div className="entry-habit">
                  <span className="large-emoji">{getHabitEmoji(entry.habit)}</span>
                  <div className="entry-title">
                    <h4>{entry.habit}</h4>
                    <p className="entry-meta">{entry.date} at {formatTime(entry.timestamp)}</p>
                  </div>
                </div>
                <button className="delete-button small" onClick={() => removeEntry(entry.id)} type="button">✕</button>
              </div>
              <div className="entry-details">
                <div className="detail-item">
                  <span className="detail-label">Trigger:</span>
                  <span className="detail-value">{entry.trigger}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Progress:</span>
                  <span className="detail-value progress-badge">{entry.progress}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No recovery logs yet. Start by logging your first entry!</p>
        )}
      </div>
    </section>
  );
}
