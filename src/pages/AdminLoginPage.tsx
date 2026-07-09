import { useState, ChangeEvent, FormEvent } from 'react';

interface AdminLoginPageProps {
  onAdminLogin: (username: string, password: string) => Promise<string | null>;
  onSwitchToUserLogin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function AdminLoginPage({ onAdminLogin, onSwitchToUserLogin, theme, onToggleTheme }: AdminLoginPageProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim()) {
      setError('❌ Username is required');
      return;
    }

    if (!formData.password.trim()) {
      setError('❌ Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const err = await onAdminLogin(formData.username, formData.password);
      if (err) {
        setError(`❌ ${err}`);
      }
    } catch (err) {
      setError(`❌ ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="admin-security-banner">
        <div className="security-icon">🛡️</div>
        <div className="security-text">
          <h3>Secure Administrative Portal</h3>
          <p>Only authorized administrators can access this area</p>
        </div>
      </div>

      <div className="auth-card admin-login-card">
        <div className="auth-header">
          <h1>
            <span className="admin-badge">🔐 ADMIN</span> Login
          </h1>
          <p>Administrative Portal Access</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">
              <span>Admin Username</span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your admin username"
                disabled={isLoading}
                autoFocus
              />
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span>Password</span>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </label>
          </div>

          <button type="submit" className="admin-login-btn" disabled={isLoading}>
            {isLoading ? '⏳ Verifying Access...' : '🔓 Admin Login'}
          </button>
        </form>

        <div className="admin-notice">
          <p>
            <strong>⚠️ Notice:</strong> This is a restricted administrative portal. Unauthorized access attempts are logged and monitored.
          </p>
        </div>

        <div className="admin-features">
          <p className="features-title">🛡️ Admin Capabilities:</p>
          <ul className="features-list">
            <li>📊 View platform statistics and analytics</li>
            <li>👥 Manage all registered users</li>
            <li>🗑️ Remove users and associated data</li>
            <li>📈 Monitor user activity and growth</li>
            <li>🔍 Search and filter user records</li>
          </ul>
        </div>

        <div className="auth-footer">
          <div className="footer-actions">
            <button className="theme-toggle" onClick={onToggleTheme} type="button">
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        <div className="user-login-switch">
          <p>Not an admin?</p>
          <button
            type="button"
            className="switch-to-user-btn"
            onClick={onSwitchToUserLogin}
          >
            👤 Back to User Login
          </button>
        </div>
      </div>

      <div className="security-badge">
        <span>🛡️ Secure Portal</span>
      </div>
    </div>
  );
}
