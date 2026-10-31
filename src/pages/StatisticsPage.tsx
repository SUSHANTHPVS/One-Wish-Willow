import { useEffect, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';
import { apiGetStatistics, type UserStatistics } from '../api';

interface StatisticsPageProps {
  currentUser: string;
  token: string;
}

export default function StatisticsPage({ currentUser, token }: StatisticsPageProps) {
  const [data, setData] = useState<UserStatistics | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'insights'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    setData(null);
    setError('');
    async function refresh() {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const result = await apiGetStatistics(token);
        if (!disposed) {
          setData(result);
          setError('');
        }
      } catch (failure) {
        if (!disposed) setError(failure instanceof Error ? failure.message : 'Unable to load statistics.');
      } finally {
        inFlight = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    window.addEventListener('one-wish-data-changed', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('one-wish-data-changed', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [token, retry]);

  if (!data) {
    return (
      <section className="page-card statistics-card" aria-busy={!error}>
        <PageTitle topic="statistics" illustrated><h2>Statistics &amp; Analytics</h2></PageTitle>
        {error ? <p role="alert">{error}</p> : <p role="status">Loading statistics...</p>}
        {error && <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button>}
      </section>
    );
  }

  const { stats } = data;
  const activityData = data.activity[selectedPeriod];
  const maxActivity = Math.max(1, ...activityData.map(entry => entry.activity));
  const totalActivity = activityData.reduce((total, entry) => total + entry.activity, 0);
  const peak = activityData.reduce((best, entry) => entry.activity > best.activity ? entry : best, activityData[0]);

  const achievements = [
    { icon: '🏆', name: 'Wish Master', description: 'Created 20+ wishes', unlocked: stats.totalWishes >= 20 },
    { icon: '✨', name: 'Consistent', description: '7-day saved-entry streak', unlocked: stats.streakDays >= 7 },
    { icon: '🎯', name: 'Achiever', description: 'Completed 10 wishes', unlocked: stats.wishesMet >= 10 },
    { icon: '📚', name: 'First Wish', description: 'Created your first wish', unlocked: stats.totalWishes >= 1 },
    { icon: '🔥', name: 'On Fire', description: '30-day saved-entry streak', unlocked: stats.streakDays >= 30 },
    { icon: '💎', name: 'Mindful', description: 'Logged 10 meditation sessions', unlocked: stats.meditationSessions >= 10 },
  ];

  const wishBreakdown = [
    { label: 'Completed', value: stats.wishesMet },
    { label: 'In Progress', value: stats.inProgress },
    { label: 'Pending', value: stats.pending },
  ].map(item => ({ ...item, percentage: stats.totalWishes ? Math.round(item.value / stats.totalWishes * 100) : 0 }));
  const preferredFeatures = data.features;
  const maxUsage = Math.max(1, ...preferredFeatures.map(feature => feature.usage));
  const topFeature = preferredFeatures.find(feature => feature.usage > 0);

  return (
    <section className="page-card statistics-card">
      <div className="page-header">
        <div>
          <PageTitle topic="statistics"><h2>Statistics & Analytics</h2></PageTitle>
          <p>{currentUser}'s saved activity · UTC</p>
          <p role="status">Updated {new Date(data.updatedAt).toLocaleTimeString()}</p>
        </div>
        <PageIllustration topic="statistics" />
      </div>
      {error && <p role="alert">Refresh failed: {error} Showing the last successful update.</p>}

      {/* Key Metrics Overview */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <span className="stat-label">Total Wishes</span>
                <span className="stat-value">{stats.totalWishes}</span>
              </div>
            </div>

            <div className="stat-tile success">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <span className="stat-label">Wishes Met</span>
                <span className="stat-value">{stats.wishesMet}</span>
                <span className="stat-subtitle">{stats.completionRate}% completion</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">{stats.streakDays}</span>
                <span className="stat-subtitle">days with saved entries</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-label">Meditation Time</span>
                <span className="stat-value">{stats.meditationMinutes}m</span>
                <span className="stat-subtitle">logged sessions</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">👁️</div>
              <div className="stat-content">
                <span className="stat-label">Saved Records</span>
                <span className="stat-value">{stats.totalRecords}</span>
                <span className="stat-subtitle">across tracked features</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">{stats.completionRate}%</span>
                <span className="stat-subtitle">All time</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <span className="stat-label">Account Age</span>
                <span className="stat-value">{stats.accountAge}</span>
                <span className="stat-subtitle">days old</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">⌚</div>
              <div className="stat-content">
                <span className="stat-label">Average Wish Progress</span>
                <span className="stat-value">{stats.averageProgress}%</span>
                <span className="stat-subtitle">all wishes</span>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="activity-summary">
            <h3>📊 Activity Summary</h3>
            <div className="activity-grid">
              <div className="activity-card">
                <span className="activity-label">Today</span>
                <span className="activity-value">{stats.todayActivity}</span>
                <span className="activity-unit">saved entries</span>
              </div>
              <div className="activity-card">
                <span className="activity-label">Last 7 Days</span>
                <span className="activity-value">{stats.weekActivity}</span>
                <span className="activity-unit">saved entries</span>
              </div>
              <div className="activity-card">
                <span className="activity-label">Last 30 Days</span>
                <span className="activity-value">{stats.monthActivity}</span>
                <span className="activity-unit">saved entries</span>
              </div>
            </div>
          </div>

          {/* Wish Breakdown */}
          <div className="breakdown-section">
            <h3>🎯 Wish Breakdown</h3>
            <div className="breakdown-list">
              {wishBreakdown.map((item) => (
                <div key={item.label} className="breakdown-item">
                  <div className="breakdown-info">
                    <span className="breakdown-label">{item.label}</span>
                    <span className="breakdown-value">{item.value}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <span className="breakdown-percentage">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Features */}
          <div className="features-section">
            <h3>🌟 Saved Records by Feature</h3>
            <div className="features-list">
              {preferredFeatures.map((feature, index) => (
                <div key={feature.name} className="feature-item">
                  <div className="feature-rank">{index + 1}</div>
                  <div className="feature-name">
                    <span className="feature-icon">{feature.icon}</span>
                    <span>{feature.name}</span>
                  </div>
                  <div className="feature-bar-container">
                    <div
                      className="feature-bar"
                      style={{ width: `${(feature.usage / maxUsage) * 100}%` }}
                    />
                  </div>
                  <span className="feature-usage">{feature.usage}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <>
          <div className="activity-controls">
            <h3>📈 {selectedPeriod === 'year' ? 'Last 12 Months' : selectedPeriod === 'month' ? 'Last 30 Days' : 'Last 7 Days'}</h3>
            <div className="period-selector">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="activity-chart">
            <div className="chart-bars">
              {activityData.map((data) => (
                <div key={data.date} className="chart-bar-group">
                  <div className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${(data.activity / maxActivity) * 300}px`,
                      }}
                    />
                  </div>
                  <span className="chart-label">{data.label}</span>
                  <span className="chart-value">{data.activity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-stats">
            <div className="activity-stat">
              <span className="stat-label">{selectedPeriod === 'year' ? 'Average Monthly Entries' : 'Average Daily Entries'}</span>
              <span className="stat-value">
                {(totalActivity / activityData.length).toFixed(1)}
              </span>
            </div>
            <div className="activity-stat">
              <span className="stat-label">{selectedPeriod === 'year' ? 'Peak Month' : 'Peak Day'}</span>
              <span className="stat-value">
                {peak.activity > 0 ? peak.label : 'No activity yet'}
              </span>
            </div>
            <div className="activity-stat">
              <span className="stat-label">Saved Entries</span>
              <span className="stat-value">
                {totalActivity}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <>
          <div className="achievements-header">
            <h3>🏆 Achievements & Badges</h3>
            <p>
              You've unlocked <strong>{achievements.filter(a => a.unlocked).length}</strong> of{' '}
              <strong>{achievements.length}</strong> achievements
            </p>
          </div>

          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                {!achievement.unlocked && <span className="locked-badge">🔒 Locked</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          <h3>💡 Personal Insights</h3>

          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">⏱️</div>
              <h4>Leading Feature</h4>
              <p className="insight-text">{topFeature ? `${topFeature.name}: ${topFeature.usage} saved records` : 'No saved activity yet.'}</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">📈</div>
              <h4>Wish Completion</h4>
              <p className="insight-text">{stats.wishesMet} of {stats.totalWishes} wishes completed ({stats.completionRate}%)</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <h4>Wish Progress</h4>
              <p className="insight-text">{stats.inProgress} wishes in progress, {stats.pending} not started</p>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🔄</div>
              <h4>Active Days</h4>
              <p className="insight-text">{stats.activeDaysMonth} days with saved entries in the last 30 days</p>
            </div>
          </div>

          <div className="tips-section">
            <h4>📝 Personalized Tips</h4>
            <ul className="tips-list">
              <li>{stats.totalWishes === 0 ? 'Create your first wish to start tracking progress.' : `${stats.totalWishes - stats.wishesMet} wishes remain unfinished.`}</li>
              <li>{stats.wishesMet >= 10 ? 'Achiever badge unlocked.' : `${10 - stats.wishesMet} more completed wishes to unlock Achiever.`}</li>
              <li>{stats.streakDays >= 7 ? `Your current saved-entry streak is ${stats.streakDays} days.` : `${Math.max(0, 7 - stats.streakDays)} more consecutive active days to reach a 7-day streak.`}</li>
            </ul>
          </div>
        </>
      )}

      {/* Tab Navigation */}
      <div className="statistics-tabs">
        {(['overview', 'activity', 'achievements', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            className={`stats-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'activity' && '📈 Activity'}
            {tab === 'achievements' && '🏆 Achievements'}
            {tab === 'insights' && '💡 Insights'}
          </button>
        ))}
      </div>
    </section>
  );
}
