import { FormEvent, useState } from 'react';
import PasswordInput from '../components/PasswordInput';
import GoogleSignIn from '../components/GoogleSignIn';

interface LoginPageProps {
  onLogin: (name: string, password: string) => Promise<string | null>;
  onGoogleLogin: (credential: string, termsAccepted: boolean) => Promise<string | null>;
  onSwitchToRegister: () => void;
  onSwitchToAdminLogin: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function LoginPage({ onLogin, onGoogleLogin, onSwitchToRegister, onSwitchToAdminLogin, theme, onToggleTheme }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    const result = await onLogin(username.trim(), password);
    if (result) {
      setError(result);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card login-card-landscape" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span>One Wish Willow</span>
          <p>Sign in to access your wishes, calendar, and weather dreams.</p>
        </div>

        <div className="login-theme-toggle">
          <span>{theme === 'dark' ? 'Moon mode' : 'Sun mode'}</span>
          <button type="button" className="text-button" onClick={onToggleTheme}>
            Switch to {theme === 'dark' ? 'Sun' : 'Moon'}
          </button>
        </div>

        <label>
          Username or Email
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username or email"
            autoComplete="username"
          />
        </label>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Login</button>

        <div className="login-divider"><span>or</span></div>
        <GoogleSignIn onGoogleLogin={onGoogleLogin} theme={theme} />

        <p className="login-note">
          New to One Wish Willow?{' '}
          <button type="button" className="text-button" onClick={onSwitchToRegister}>
            Register
          </button>
        </p>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="admin-access-btn"
          onClick={onSwitchToAdminLogin}
        >
          🔐 Admin Access
        </button>
      </form>
    </main>
  );
}
