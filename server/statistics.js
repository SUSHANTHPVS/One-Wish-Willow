const DAY = 24 * 60 * 60 * 1000;

export function buildStatistics(user, sources, now = new Date()) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dates = sources.flatMap(source => source.records.map(record => new Date(record.createdAt || record.completedAt || record.date)))
    .filter(date => Number.isFinite(date.getTime()) && date.getTime() <= now.getTime());
  const dayKey = date => date.toISOString().slice(0, 10);
  const activeDays = new Set(dates.map(dayKey));
  const wishes = sources.find(source => source.name === 'Wish List')?.records || [];
  const completed = wishes.filter(wish => wish.progress >= 100).length;
  const inProgress = wishes.filter(wish => wish.progress > 0 && wish.progress < 100).length;
  let streakDays = 0;
  let cursor = activeDays.has(dayKey(new Date(today))) ? today : today - DAY;
  while (activeDays.has(dayKey(new Date(cursor)))) {
    streakDays += 1;
    cursor -= DAY;
  }
  const countSince = start => dates.filter(date => date.getTime() >= start).length;
  const dailyActivity = length => Array.from({ length }, (_, index) => {
    const date = new Date(today - (length - index - 1) * DAY);
    return {
      date: dayKey(date),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      activity: dates.filter(entry => dayKey(entry) === dayKey(date)).length,
    };
  });
  const year = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const monthKey = date.toISOString().slice(0, 7);
    return {
      date: monthKey,
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      activity: dates.filter(entry => entry.toISOString().startsWith(monthKey)).length,
    };
  });
  const meditation = sources.find(source => source.name === 'Meditation')?.records || [];
  return {
    stats: {
      totalWishes: wishes.length,
      wishesMet: completed,
      inProgress,
      pending: wishes.length - completed - inProgress,
      completionRate: wishes.length ? Math.round(completed / wishes.length * 100) : 0,
      averageProgress: wishes.length ? Math.round(wishes.reduce((total, wish) => total + Math.max(0, Math.min(100, wish.progress || 0)), 0) / wishes.length) : 0,
      streakDays,
      totalRecords: sources.reduce((total, source) => total + source.records.length, 0),
      meditationMinutes: meditation.reduce((total, session) => total + (session.duration || 0), 0),
      meditationSessions: meditation.length,
      accountAge: Math.max(0, Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / DAY)),
      joinDate: user.createdAt,
      todayActivity: countSince(today),
      weekActivity: countSince(today - 6 * DAY),
      monthActivity: countSince(today - 29 * DAY),
      activeDaysMonth: [...activeDays].filter(date => date >= dayKey(new Date(today - 29 * DAY))).length,
    },
    activity: { week: dailyActivity(7), month: dailyActivity(30), year },
    features: sources.map(source => ({ name: source.name, usage: source.records.length, icon: source.icon }))
      .sort((first, second) => second.usage - first.usage),
    updatedAt: now.toISOString(),
  };
}