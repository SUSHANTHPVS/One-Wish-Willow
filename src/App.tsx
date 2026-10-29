import { useEffect, useState } from 'react';
import { Route, Routes, NavLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import WeatherPage from './pages/WeatherPage';
import ProfilePage from './pages/ProfilePage';
import StatisticsPage from './pages/StatisticsPage';
import FitnessPage from './pages/FitnessPage';
import MusicPage from './pages/MusicPage';
import AssistantPage from './pages/AssistantPage';
import MentalHealthPage from './pages/MentalHealthPage';
import AddictionHelpPage from './pages/AddictionHelpPage';
import TranslatePage from './pages/TranslatePage';
import LanguagesPage from './pages/LanguagesPage';
import WishListPage from './pages/WishListPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import NotificationCenter from './components/NotificationCenter';
import UserMenu from './components/UserMenu';
import { apiLogin, apiRegister, apiAdminLogin, apiGoogleLogin } from './api';

interface AuthSession {
  username: string;
  token: string;
  role?: string;
}

const USER_STORAGE_KEY = 'one-wish-user';
const ADMIN_STORAGE_KEY = 'one-wish-admin';
const THEME_STORAGE_KEY = 'one-wish-theme';


function loadTheme() {
  if (typeof window === 'undefined') return 'dark' as const;
  try {
    return (window.localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'dark';
  } catch {
    return 'dark';
  }
}

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminSession, setAdminSession] = useState<AuthSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin-login'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  useEffect(() => {
    if (authSession) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authSession));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [authSession]);

  useEffect(() => {
    if (adminSession) {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminSession));
    } else {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, [adminSession]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  async function handleLogin(username: string, password: string) {
    try {
      const result = await apiLogin(username, password);
      const session = { username: result.user.username, token: result.token };
      setAuthSession(session);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  async function handleRegister(username: string, email: string, password: string) {
    try {
      const result = await apiRegister(username, email, password);
      const session = { username: result.user.username, token: result.token };
      setAuthSession(session);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  async function handleGoogleLogin(credential: string, termsAccepted: boolean) {
    try {
      const result = await apiGoogleLogin(credential, termsAccepted);
      setAuthSession({ username: result.user.username, token: result.token });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Google sign-in failed.';
    }
  }

  async function handleAdminLogin(username: string, password: string) {
    try {
      const result = await apiAdminLogin(username, password);
      const session = { username: result.user.username, token: result.token, role: 'admin' };
      setAdminSession(session);
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }

  function handleLogout() {
    setAuthSession(null);
  }

  function handleAdminLogout() {
    setAdminSession(null);
    setAuthMode('login');
  }

  function switchToRegister() {
    setAuthMode('register');
  }

  function switchToAdminLogin() {
    setAuthMode('admin-login');
  }

  function switchToLogin() {
    setAuthMode('login');
  }

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  // Admin session check
  if (adminSession) {
    return (
      <div className="app-shell admin-shell">
        <AdminDashboard
          adminUsername={adminSession.username}
          token={adminSession.token}
          onLogout={handleAdminLogout}
        />
      </div>
    );
  }

  // Regular user authentication
  if (!authSession) {
    return authMode === 'admin-login' ? (
      <AdminLoginPage
        onAdminLogin={handleAdminLogin}
        onSwitchToUserLogin={switchToLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    ) : authMode === 'register' ? (
      <RegisterPage
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToLogin={switchToLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    ) : (
      <LoginPage
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSwitchToRegister={switchToRegister}
        onSwitchToAdminLogin={switchToAdminLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>
            <span className="title-accent">O</span>ne{' '}
            <span className="title-accent">W</span>ish{' '}
            <span className="title-accent">W</span>illow
          </h1>
          <p>Welcome back, {authSession.username}. Dream. Plan. Remember.</p>
        </div>
        <div className="header-navigation">
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'active' : '')}>
            Calendar
          </NavLink>
          <NavLink to="/weather" className={({ isActive }) => (isActive ? 'active' : '')}>
            Weather
          </NavLink>
          <NavLink to="/fitness" className={({ isActive }) => (isActive ? 'active' : '')}>
            Fitness
          </NavLink>
          <NavLink to="/music" className={({ isActive }) => (isActive ? 'active' : '')}>
            Music
          </NavLink>
          <NavLink to="/assistant" className={({ isActive }) => (isActive ? 'active' : '')}>
            Assistant
          </NavLink>
          <NavLink to="/mental-health" className={({ isActive }) => (isActive ? 'active' : '')}>
            Mental Health
          </NavLink>
          <NavLink to="/addiction-help" className={({ isActive }) => (isActive ? 'active' : '')}>
            Addiction Help
          </NavLink>
          <NavLink to="/translate" className={({ isActive }) => (isActive ? 'active' : '')}>
            Translate
          </NavLink>
          <NavLink to="/wish-list" className={({ isActive }) => (isActive ? 'active' : '')}>
            Wish List
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => (isActive ? 'active' : '')}>
            Statistics
          </NavLink>
          <NotificationCenter token={authSession.token} />
          <button className="theme-toggle-button" onClick={toggleTheme} type="button">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </nav>
        <UserMenu username={authSession.username} token={authSession.token} onLogout={handleLogout} />
        </div>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage currentUser={authSession.username} />} />
          <Route path="/calendar" element={<CalendarPage currentUser={authSession.username} token={authSession.token} />} />
          <Route path="/weather" element={<WeatherPage currentUser={authSession.username} />} />
          <Route path="/fitness" element={<FitnessPage currentUser={authSession.username} />} />
          <Route path="/music" element={<MusicPage currentUser={authSession.username} />} />
          <Route path="/assistant" element={<AssistantPage currentUser={authSession.username} token={authSession.token} />} />
          <Route path="/mental-health" element={<MentalHealthPage currentUser={authSession.username} />} />
          <Route path="/addiction-help" element={<AddictionHelpPage currentUser={authSession.username} />} />
          <Route path="/translate" element={<TranslatePage currentUser={authSession.username} token={authSession.token} />} />
          <Route path="/wish-list" element={<WishListPage token={authSession.token} />} />
          <Route path="/profile" element={<ProfilePage currentUser={authSession.username} token={authSession.token} />} />
          <Route path="/statistics" element={<StatisticsPage currentUser={authSession.username} token={authSession.token} />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} />
          <Route path="/privacy" element={<TermsAndConditionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>One Wish Willow • Inspired by Obsession • © 2026 All Rights Reserved</span>
      </footer>
    </div>
  );
}

function AppOpening() {
  const [showOpening, setShowOpening] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try {
      return window.sessionStorage.getItem('one-wish-opening-seen') !== '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showOpening) return;
    try {
      window.sessionStorage.setItem('one-wish-opening-seen', '1');
    } catch {
      setShowOpening(false);
      return;
    }
    const dismiss = () => setShowOpening(false);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = () => {
      if (preference.matches) dismiss();
    };
    const timer = window.setTimeout(dismiss, 1400);
    document.addEventListener('pointerdown', dismiss, { once: true });
    document.addEventListener('keydown', dismiss, { once: true });
    preference.addEventListener('change', onPreferenceChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
      preference.removeEventListener('change', onPreferenceChange);
    };
  }, [showOpening]);

  return (
    <>
      <App />
      {showOpening && (
        <div
          className="app-opening"
          aria-hidden="true"
          onAnimationEnd={event => {
            if (event.target === event.currentTarget && event.animationName === 'willow-opening-away') {
              setShowOpening(false);
            }
          }}
        >
          <div className="opening-brand">
            <div className="opening-wordmark">
              <span>One</span>{' '}<span>Wish</span>{' '}<span>Willow</span>
            </div>
            <div className="opening-rule" />
            <p>Dream. Plan. Remember.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default AppOpening;
