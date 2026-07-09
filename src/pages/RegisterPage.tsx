import { FormEvent, useState } from 'react';

interface RegisterPageProps {
  onRegister: (username: string, email: string, password: string) => Promise<string | null>;
  onSwitchToLogin: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function RegisterPage({ onRegister, onSwitchToLogin, theme, onToggleTheme }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) {
      setError('Enter a username to create an account.');
      return;
    }
    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('❌ You must accept the Terms and Conditions to register.');
      return;
    }

    const result = await onRegister(username.trim(), email.trim(), password);
    if (result) {
      setError(result);
      return;
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span>One Wish Willow</span>
          <p>Create your account and start building your wish world.</p>
        </div>

        <div className="login-theme-toggle">
          <span>{theme === 'dark' ? 'Moon mode' : 'Sun mode'}</span>
          <button type="button" className="text-button" onClick={onToggleTheme}>
            Switch to {theme === 'dark' ? 'Sun' : 'Moon'}
          </button>
        </div>

        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
          />
        </label>

        <label>
          Email ID
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Choose password"
            autoComplete="new-password"
          />
        </label>

        <label>
          Confirm Password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
          />
        </label>

        <label className="terms-checkbox">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>
            I accept the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </span>
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Create Account</button>

        <p className="login-note">
          Already have an account?{' '}
          <button type="button" className="text-button" onClick={onSwitchToLogin}>
            Login
          </button>
        </p>
      </form>
    </main>
  );
}
