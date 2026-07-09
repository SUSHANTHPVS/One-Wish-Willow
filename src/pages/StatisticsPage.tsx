import { useEffect, useState } from 'react';

interface UserStats {
  totalWishes: number;
  wishesMet: number;
  streakDays: number;
  sessionTime: number;
  profileViews: number;
  completionRate: number;
  averageSessionLength: number;
  lastActive: string;
  joinDate: string;
  accountAge: number;
  todayActivity: number;
  weekActivity: number;
  monthActivity: number;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

interface ChartData {
  label: string;
  value: number;
  percentage: number;
}

interface ActivityData {
  date: string;
  activity: number;
}

interface StatisticsPageProps {
  currentUser: string;
  token: string;
}

export default function StatisticsPage({ currentUser, token }: StatisticsPageProps) {
  const [stats, setStats] = useState<UserStats>({
    totalWishes: 24,
    wishesMet: 18,
    streakDays: 12,
    sessionTime: 8420,
    profileViews: 156,
    completionRate: 75,
    averageSessionLength: 45,
    lastActive: 'Just now',
    joinDate: 'Jan 15, 2024',
    accountAge: 175,
    todayActivity: 42,
    weekActivity: 287,
    monthActivity: 1203,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'insights'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Mock activity data
  const activityData: ActivityData[] = [
    { date: 'Mon', activity: 45 },
    { date: 'Tue', activity: 62 },
    { date: 'Wed', activity: 38 },
    { date: 'Thu', activity: 55 },
    { date: 'Fri', activity: 71 },
    { date: 'Sat', activity: 48 },
    { date: 'Sun', activity: 68 },
  ];

  const achievements = [
    { icon: '🏆', name: 'Wish Master', description: 'Created 20+ wishes', unlocked: true },
    { icon: '✨', name: 'Consistent', description: '7-day streak', unlocked: true },
    { icon: '🎯', name: 'Achiever', description: 'Completed 10 wishes', unlocked: true },
    { icon: '📚', name: 'Explorer', description: 'Visited all features', unlocked: true },
    { icon: '🔥', name: 'On Fire', description: '30-day streak', unlocked: false },
    { icon: '💎', name: 'Premium User', description: 'Upgraded account', unlocked: false },
  ];

  const wishBreakdown: ChartData[] = [
    { label: 'Completed', value: stats.wishesMet, percentage: 75 },
    { label: 'In Progress', value: 4, percentage: 17 },
    { label: 'Pending', value: 2, percentage: 8 },
  ];

  const preferredFeatures = [
    { name: 'Wish List', usage: 245, icon: '✨' },
    { name: 'Calendar', usage: 198, icon: '📅' },
    { name: 'Weather', usage: 156, icon: '🌤️' },
    { name: 'Fitness', usage: 123, icon: '💪' },
    { name: 'Translate', usage: 89, icon: '🌐' },
    { name: 'Music', usage: 67, icon: '🎵' },
  ];

  const maxUsage = Math.max(...preferredFeatures.map(f => f.usage));

  return (
    <section className="page-card statistics-card">
      <div className="page-header">
        <div>
          <h2>📊 Statistics & Analytics</h2>
          <p>Your personal performance and activity metrics</p>
        </div>
      </div>

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
                <span className="stat-subtitle">↑ 75% completion</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">{stats.streakDays}</span>
                <span className="stat-subtitle">days active</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-label">Total Time Spent</span>
                <span className="stat-value">{Math.floor(stats.sessionTime / 60)}h</span>
                <span className="stat-subtitle">{stats.sessionTime} min</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-icon">👁️</div>
              <div className="stat-content">
                <span className="stat-label">Profile Views</span>
                <span className="stat-value">{stats.profileViews}</span>
                <span className="stat-subtitle">↑ +12 this week</span>
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
                <span className="stat-label">Avg Session</span>
                <span className="stat-value">{stats.averageSessionLength}m</span>
                <span className="stat-subtitle">per session</span>
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
                <span className="activity-unit">actions</span>
              </div>
              <div className="activity-card">
                <span className="activity-label">This Week</span>
                <span className="activity-value">{stats.weekActivity}</span>
                <span className="activity-unit">actions</span>
              </div>
              <div className="activity-card">
                <span className="activity-label">This Month</span>
                <span className="activity-value">{stats.monthActivity}</span>
                <span className="activity-unit">actions</span>
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
            <h3>🌟 Most Used Features</h3>
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
            <h3>📈 Weekly Activity</h3>
            <div className="period-selector">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(period as any)}
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
                        height: `${(data.activity / 100) * 300}px`,
                      }}
                    />
                  </div>
                  <span className="chart-label">{data.date}</span>
                  <span className="chart-value">{data.activity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-stats">
            <div className="activity-stat">
              <span className="stat-label">Average Daily Activity</span>
              <span className="stat-value">
                {Math.round(activityData.reduce((acc, d) => acc + d.activity, 0) / activityData.length)}
              </span>
            </div>
            <div className="activity-stat">
              <span className="stat-label">Peak Day</span>
              <span className="stat-value">
                {activityData[activityData.reduce((maxIdx, d, i, arr) => d.activity > arr[maxIdx].activity ? i : maxIdx, 0)].date}
              </span>
            </div>
            <div className="activity-stat">
              <span className="stat-label">Total Actions</span>
              <span className="stat-value">
                {activityData.reduce((acc, d) => acc + d.activity, 0)}
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
              <h4>Best Time to Be Active</h4>
              <p className="insight-text">You're most active on Fridays at 7-8 PM</p>
              <span className="insight-tip">💡 Try scheduling important tasks during this time!</span>
            </div>

            <div className="insight-card">
              <div className="insight-icon">📈</div>
              <h4>Growth Trajectory</h4>
              <p className="insight-text">Your completion rate has improved by 12% this month</p>
              <span className="insight-tip">💡 Keep up the momentum!</span>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <h4>Most Common Goal</h4>
              <p className="insight-text">Personal Development goals are your strength</p>
              <span className="insight-tip">💡 Challenge yourself with new categories!</span>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🔄</div>
              <h4>Consistency Score</h4>
              <p className="insight-text">You've maintained an 85% consistency rate</p>
              <span className="insight-tip">💡 Aim for 100% to unlock special badges!</span>
            </div>
          </div>

          <div className="tips-section">
            <h4>📝 Personalized Tips</h4>
            <ul className="tips-list">
              <li>✅ You're on track to achieve your monthly goals!</li>
              <li>🎯 Consider setting a reminder for your low-activity days</li>
              <li>📚 Explore features you haven't used yet to broaden your experience</li>
              <li>🏆 One more wish to unlock the "Achiever" badge!</li>
            </ul>
          </div>
        </>
      )}

      {/* Tab Navigation */}
      <div className="statistics-tabs">
        {['overview', 'activity', 'achievements', 'insights'].map((tab) => (
          <button
            key={tab}
            className={`stats-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab as any)}
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
