import { useEffect, useMemo, useState } from 'react';

interface FitnessEntry {
  id: string;
  date: string;
  activity: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  mood: string;
  completed: boolean;
  goal: GoalSettings['goal'];
}

interface GoalSettings {
  goal: 'Weight loss' | 'Strength' | 'Endurance' | 'Stress relief' | 'General wellness';
  weeklyTargetMinutes: number;
}

interface FitnessPageProps {
  currentUser: string;
}

const goalOptions: GoalSettings['goal'][] = ['Weight loss', 'Strength', 'Endurance', 'Stress relief', 'General wellness'];

const goalRecommendations: Record<GoalSettings['goal'], Array<{ title: string; summary: string; actions: string[] }>> = {
  'Weight loss': [
    { title: 'Brisk walking + intervals', summary: 'A brisk walk plus quick intervals helps burn calories without overloading your joints.', actions: ['Walk 30–40 min', 'Add 5 mins of light intervals', 'Keep a hydration reminder nearby'] },
    { title: 'Strength circuit', summary: 'Two strength sessions a week can boost metabolism and preserve lean muscle.', actions: ['Do 20 min bodyweight circuits', 'Focus on squats, push-ups, lunges', 'Aim for 2 sessions this week'] },
  ],
  Strength: [
    { title: 'Strength focus', summary: 'Progressive strength work is your best bet for building confidence and muscle.', actions: ['Lift 3x per week', 'Use 2–3 sets of 8–12 reps', 'Choose compound moves first'] },
    { title: 'Recovery block', summary: 'Recovery keeps you fresh for the next training session.', actions: ['Add 10 min mobility', 'Sleep 7–8 hours', 'Keep protein intake consistent'] },
  ],
  Endurance: [
    { title: 'Cardio build', summary: 'Steady cardio sessions will improve stamina and energy.', actions: ['Try 25–40 min steady cardio', 'Add one longer weekend session', 'Keep pace conversational'] },
    { title: 'Recovery breathing', summary: 'Better breath control helps you maintain consistency.', actions: ['Do 5 min breathing drills', 'Stretch post-workout', 'Use a simple pace tracker'] },
  ],
  'Stress relief': [
    { title: 'Gentle movement', summary: 'Slow, mindful movement helps calm the nervous system.', actions: ['Try yoga or mobility', 'Keep sessions low pressure', 'Pair with a calming playlist'] },
    { title: 'Reset routine', summary: 'Short recovery sessions can lift mood and reduce tension.', actions: ['Take a 15 min walk', 'Practice 5 min breathing', 'Keep your workout light and restorative'] },
  ],
  'General wellness': [
    { title: 'Balanced routine', summary: 'A balanced week keeps you consistent without feeling overwhelming.', actions: ['Mix walking and strength', 'Aim for 3 short sessions', 'Track your energy after each workout'] },
    { title: 'Mindful recovery', summary: 'Recovery matters as much as effort.', actions: ['Stretch for 10 min', 'Stay hydrated', 'Log how you feel after each session'] },
  ],
};

const goalWorkoutPresets: Record<GoalSettings['goal'], Array<{ title: string; summary: string; duration: number; intensity: 'Low' | 'Medium' | 'High'; mood: string }>> = {
  'Weight loss': [
    { title: 'Jogging', summary: 'A steady run or jog that helps burn calories and improve heart health.', duration: 30, intensity: 'Medium', mood: 'Energized' },
    { title: 'HIIT Circuit', summary: 'Short high-intensity intervals using squats, burpees, and jumping jacks.', duration: 20, intensity: 'High', mood: 'Determined' },
    { title: 'Cycling', summary: 'A low-impact cardio session that is great for fat loss and endurance.', duration: 35, intensity: 'Medium', mood: 'Focused' },
  ],
  Strength: [
    { title: 'Bench Press', summary: 'A classic upper-body strength lift for chest, shoulders, and triceps.', duration: 40, intensity: 'High', mood: 'Strong' },
    { title: 'Squat Session', summary: 'A compound leg workout that builds strength and stability.', duration: 35, intensity: 'High', mood: 'Powerful' },
    { title: 'Deadlift Training', summary: 'A full-body strength movement that targets posterior chain muscles.', duration: 35, intensity: 'High', mood: 'Focused' },
  ],
  Endurance: [
    { title: 'Long Distance Run', summary: 'A longer steady run to build stamina and aerobic capacity.', duration: 50, intensity: 'Medium', mood: 'Calm' },
    { title: 'Swimming', summary: 'A full-body endurance workout that is easy on the joints.', duration: 40, intensity: 'Medium', mood: 'Driven' },
    { title: 'Rowing Session', summary: 'A continuous rowing workout that improves cardiovascular endurance.', duration: 30, intensity: 'Medium', mood: 'Steady' },
  ],
  'Stress relief': [
    { title: 'Yoga', summary: 'A calming yoga practice that improves flexibility and reduces stress.', duration: 25, intensity: 'Low', mood: 'Relaxed' },
    { title: 'Pilates', summary: 'A gentle core and mobility workout that supports recovery.', duration: 20, intensity: 'Low', mood: 'Peaceful' },
    { title: 'Walking Meditation', summary: 'A slow outdoor walk that helps clear your mind and lower tension.', duration: 20, intensity: 'Low', mood: 'Balanced' },
  ],
  'General wellness': [
    { title: 'Bodyweight Workout', summary: 'A simple full-body routine with push-ups, lunges, and planks.', duration: 25, intensity: 'Medium', mood: 'Balanced' },
    { title: 'Mobility Routine', summary: 'A short session focused on flexibility and joint health.', duration: 20, intensity: 'Low', mood: 'Light' },
    { title: 'Easy Bike Ride', summary: 'A relaxed ride that keeps you active without overloading your body.', duration: 30, intensity: 'Low', mood: 'Fresh' },
  ],
};

function storageKey(user: string) {
  return `one-wish-${user}-fitness`;
}

function goalStorageKey(user: string) {
  return `one-wish-${user}-fitness-goal`;
}

function loadFitnessEntries(user: string): FitnessEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((entry: Partial<FitnessEntry>) => ({
      ...entry,
      completed: Boolean(entry.completed),
      goal: entry.goal || 'General wellness',
    })) as FitnessEntry[];
  } catch {
    return [];
  }
}

function loadGoalSettings(user: string): GoalSettings {
  if (typeof window === 'undefined') return { goal: 'General wellness', weeklyTargetMinutes: 180 };
  try {
    const saved = window.localStorage.getItem(goalStorageKey(user));
    return saved ? JSON.parse(saved) : { goal: 'General wellness', weeklyTargetMinutes: 180 };
  } catch {
    return { goal: 'General wellness', weeklyTargetMinutes: 180 };
  }
}

export default function FitnessPage({ currentUser }: FitnessPageProps) {
  const [activity, setActivity] = useState('Morning walk');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [mood, setMood] = useState('Focused');
  const [entries, setEntries] = useState<FitnessEntry[]>(() => loadFitnessEntries(currentUser));
  const [goal, setGoal] = useState<GoalSettings['goal']>(() => loadGoalSettings(currentUser).goal);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(() => loadGoalSettings(currentUser).weeklyTargetMinutes);

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(entries));
  }, [entries, currentUser]);

  useEffect(() => {
    window.localStorage.setItem(goalStorageKey(currentUser), JSON.stringify({ goal, weeklyTargetMinutes }));
  }, [goal, weeklyTargetMinutes, currentUser]);

  const totalMinutes = useMemo(() => entries.reduce((sum, entry) => sum + entry.duration, 0), [entries]);
  const completedMinutes = useMemo(() => entries.filter((entry) => entry.completed).reduce((sum, entry) => sum + entry.duration, 0), [entries]);
  const workoutCount = entries.length;
  const completedWorkoutCount = entries.filter((entry) => entry.completed).length;
  const averageIntensity = useMemo(() => {
    if (!entries.length) return '—';
    const value = entries.reduce((sum, entry) => sum + (entry.intensity === 'Low' ? 1 : entry.intensity === 'Medium' ? 2 : 3), 0) / entries.length;
    return value < 1.7 ? 'Low' : value < 2.4 ? 'Medium' : 'High';
  }, [entries]);
  const progressPercent = Math.min(100, Math.round((completedMinutes / Math.max(weeklyTargetMinutes, 1)) * 100));
  const recommendations = useMemo(() => goalRecommendations[goal], [goal]);
  const presetWorkouts = useMemo(() => goalWorkoutPresets[goal], [goal]);

  function addEntry(overrides?: { activityValue?: string; durationValue?: number; intensityValue?: 'Low' | 'Medium' | 'High'; moodValue?: string }) {
    const nextActivity = (overrides?.activityValue ?? activity).trim();
    const nextDuration = overrides?.durationValue ?? duration;
    const nextIntensity = overrides?.intensityValue ?? intensity;
    const nextMood = (overrides?.moodValue ?? mood).trim() || 'Balanced';
    if (!nextActivity || nextDuration <= 0) return;
    const newEntry: FitnessEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      activity: nextActivity,
      duration: nextDuration,
      intensity: nextIntensity,
      mood: nextMood,
      completed: false,
      goal,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setActivity(nextActivity);
    setDuration(nextDuration);
    setIntensity(nextIntensity);
    setMood(nextMood);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  function toggleEntryCompletion(id: string) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, completed: !entry.completed } : entry)));
  }

  function addPresetWorkout(preset: (typeof presetWorkouts)[number]) {
    addEntry({
      activityValue: preset.title,
      durationValue: preset.duration,
      intensityValue: preset.intensity,
      moodValue: preset.mood,
    });
  }

  return (
    <section className="page-card fitness-page">
      <div className="page-header">
        <div>
          <h2>Fitness & Wellness</h2>
          <p>Set a goal, track workouts, and get coaching suggestions that match your energy and focus.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span>Sessions</span>
          <strong>{workoutCount}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{completedWorkoutCount}/{workoutCount}</strong>
        </div>
        <div className="stat-card">
          <span>Completed Minutes</span>
          <strong>{completedMinutes} min</strong>
        </div>
        <div className="stat-card">
          <span>Avg Intensity</span>
          <strong>{averageIntensity}</strong>
        </div>
      </div>

      <div className="goal-card">
        <div className="goal-card-heading">
          <div>
            <h3>Weekly goal</h3>
            <p>Choose the focus that best matches your week.</p>
          </div>
          <div className="goal-pill">{goal}</div>
        </div>
        <div className="goal-form">
          <label>
            Goal
            <select value={goal} onChange={(event) => setGoal(event.target.value as GoalSettings['goal'])}>
              {goalOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Weekly target (minutes)
            <input type="number" min="30" value={weeklyTargetMinutes} onChange={(event) => setWeeklyTargetMinutes(Number(event.target.value))} />
          </label>
        </div>
        <div className="goal-progress">
          <div className="progress-bar"><span style={{ width: `${progressPercent}%` }} /></div>
          <p>{completedMinutes} / {weeklyTargetMinutes} minutes completed • {progressPercent}% of your target</p>
        </div>
      </div>

      <div className="recommendation-grid">
        {recommendations.map((item) => (
          <article key={item.title} className="recommendation-card">
            <h4>{item.title}</h4>
            <p>{item.summary}</p>
            <ul>
              {item.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="preset-section">
        <div className="section-heading">
          <h3>Goal-based workouts</h3>
          <p>Tap a preset to add it instantly to your plan.</p>
        </div>
        <div className="preset-grid">
          {presetWorkouts.map((preset) => (
            <article key={preset.title} className="preset-card">
              <div>
                <h4>{preset.title}</h4>
                <p>{preset.summary}</p>
              </div>
              <div className="preset-meta">
                <span>{preset.duration} min • {preset.intensity}</span>
                <button type="button" className="primary-button" onClick={() => addPresetWorkout(preset)}>Add workout</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="calendar-form">
        <input value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Activity (e.g. Yoga, Walk, Run)" />
        <input type="number" min="5" value={duration} onChange={(event) => setDuration(Number(event.target.value))} placeholder="Duration (minutes)" />
        <select value={intensity} onChange={(event) => setIntensity(event.target.value as 'Low' | 'Medium' | 'High')}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <input value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Mood after workout" />
        <button className="full-width" onClick={() => addEntry()} type="button">Save workout</button>
      </div>

      <div className="event-list">
        {entries.length ? (
          entries.map((entry) => (
            <article key={entry.id} className={`event-card${entry.completed ? ' completed' : ''}`}>
              <div className="event-card-heading">
                <div>
                  <h4>{entry.activity}</h4>
                  <p>{entry.date} • {entry.duration} min • {entry.intensity}</p>
                </div>
                <button className="delete-button" onClick={() => removeEntry(entry.id)} type="button">Remove</button>
              </div>
              <div className="event-footer">
                <label className="completion-toggle">
                  <input type="checkbox" checked={entry.completed} onChange={() => toggleEntryCompletion(entry.id)} />
                  <span>{entry.completed ? 'Completed' : 'Mark complete'}</span>
                </label>
                <p className="event-notes">Goal: {entry.goal} • Mood: {entry.mood}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No fitness entries yet. Log one to build momentum.</p>
        )}
      </div>
    </section>
  );
}
