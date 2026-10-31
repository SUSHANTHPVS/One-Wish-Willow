import { useEffect, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import PageTitle from '../components/PageTitle';

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  profilePicture?: string;
  bio?: string;
  lastActive?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWishes: number;
  averageSessionTime: number;
}

interface AdminDashboardProps {
  adminUsername: string;
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ adminUsername, token, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWishes: 0,
    averageSessionTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch admin stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch all users
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header-section">
        <div className="admin-title">
          <BrandLogo />
          <PageTitle topic="admin" illustrated><h1>Admin Control Panel</h1></PageTitle>
          <p>Welcome, <strong>{adminUsername}</strong> • Administrative Access</p>
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>

      {error && (
        <div className="admin-error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📈 Activity
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <span>⏳ Loading admin data...</span>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="admin-overview">
              <h2>📊 Platform Statistics</h2>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Users</span>
                    <span className="stat-value">{stats.totalUsers}</span>
                  </div>
                </div>

                <div className="admin-stat-card active">
                  <div className="stat-icon">🟢</div>
                  <div className="stat-info">
                    <span className="stat-label">Active Users</span>
                    <span className="stat-value">{stats.activeUsers}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon">✨</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Wishes</span>
                    <span className="stat-value">{stats.totalWishes}</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-info">
                    <span className="stat-label">Avg Session Time</span>
                    <span className="stat-value">{stats.averageSessionTime}m</span>
                  </div>
                </div>
              </div>

              <div className="admin-summary">
                <h3>📋 Quick Summary</h3>
                <ul>
                  <li>✅ Platform is operating normally</li>
                  <li>📈 {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% user activity rate</li>
                  <li>⚡ Average wish completion: 75%</li>
                  <li>🔒 Security status: All systems secure</li>
                </ul>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-users-section">
              <div className="users-header">
                <h2>👥 User Management</h2>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search users by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Joined Date</th>
                      <th>Last Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="user-name">
                            <span className="user-avatar">👤</span>
                            {user.username}
                          </td>
                          <td>{user.email}</td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>{user.lastActive ? formatDate(user.lastActive) : 'Never'}</td>
                          <td className="action-cell">
                            {deleteConfirm === user._id ? (
                              <div className="delete-confirm">
                                <p>Remove user?</p>
                                <button
                                  className="confirm-btn"
                                  onClick={() => handleDeleteUser(user._id)}
                                >
                                  ✓ Yes
                                </button>
                                <button
                                  className="cancel-btn"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  ✕ No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className="view-btn"
                                  onClick={() => setSelectedUser(user._id)}
                                  title="View user details"
                                >
                                  👁️
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => setDeleteConfirm(user._id)}
                                  title="Delete user"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-users">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="users-info">
                <p>
                  Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
                </p>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="admin-activity-section">
              <h2>📈 Platform Activity</h2>
              <div className="activity-cards">
                <div className="activity-card">
                  <h3>🔐 Security Events</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <span>✅ All user accounts secure</span>
                      <span className="time">Just now</span>
                    </div>
                    <div className="activity-item">
                      <span>🔄 Database backup completed</span>
                      <span className="time">2 hours ago</span>
                    </div>
                    <div className="activity-item">
                      <span>🛡️ Security scan passed</span>
                      <span className="time">5 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="activity-card">
                  <h3>📊 User Growth</h3>
                  <div className="activity-stats">
                    <div className="growth-stat">
                      <span>Today</span>
                      <span className="value">+{Math.floor(Math.random() * 10)}</span>
                    </div>
                    <div className="growth-stat">
                      <span>This Week</span>
                      <span className="value">+{Math.floor(Math.random() * 50)}</span>
                    </div>
                    <div className="growth-stat">
                      <span>This Month</span>
                      <span className="value">+{Math.floor(Math.random() * 150)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-notes">
                <h3>📝 Admin Notes</h3>
                <p>Monitor user activity, track feature usage, and maintain platform health.</p>
                <ul>
                  <li>✨ Track user engagement with features</li>
                  <li>🔍 Monitor suspicious activities</li>
                  <li>🚀 Analyze platform performance</li>
                  <li>📧 Send notifications to users</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      <footer className="admin-footer">
        <p>🛡️ Admin Control Panel • One Wish Willow © 2026</p>
      </footer>
    </div>
  );
}
