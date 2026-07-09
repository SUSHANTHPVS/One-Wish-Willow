# Design Document — One Wish Willow Enhancements

## Overview

This document describes the technical design for all eight enhancement areas of the One Wish Willow application. The current app is a client-only React 18 + TypeScript + Vite SPA that stores everything in `localStorage`. The enhancements introduce a Node/Express backend, a SQLite database, JWT authentication, real weather data, drag-and-drop calendar scheduling, gamification, automated testing, and a CI/CD pipeline.

---

## 1. System Architecture

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│        Browser (SPA)            │  HTTP  │       API Server (Node/Express)  │
│  React 18 + TypeScript + Vite   │◄──────►│  REST API  │  Auth Service       │
│  React Router v6                │        │  JWT middleware                   │
│  React Context (AuthContext)    │        │  bcrypt password hashing          │
│  Custom hooks (useWishes, etc.) │        │  Nodemailer (email notifications) │
└─────────────────────────────────┘        └──────────────┬───────────────────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │  SQLite DB  │
                                                    │  (better-   │
                                                    │   sqlite3)  │
                                                    └─────────────┘
```

**Frontend** runs on Vite dev server (port 5173) or is served as a static build from the hosting platform.  
**Backend** runs as a Node/Express server (port 3001) during development, deployed to Railway or Render in production.  
**Database** is SQLite via `better-sqlite3` for simplicity in development; can be swapped for PostgreSQL in production by changing the adapter.

---

## 2. Directory Structure

```
one-wish-willow/
├── server/                        # Node/Express backend
│   ├── src/
│   │   ├── index.ts               # Express app entry point
│   │   ├── db.ts                  # better-sqlite3 connection + migrations
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification middleware
│   │   │   └── rateLimit.ts       # Login rate limiter
│   │   └── routes/
│   │       ├── auth.ts            # POST /api/auth/register, login, refresh, logout
│   │       ├── wishes.ts          # CRUD /api/wishes
│   │       ├── tasks.ts           # CRUD /api/tasks
│   │       ├── profile.ts         # GET/PUT /api/profile
│   │       ├── weather.ts         # GET/PUT /api/weather-prefs
│   │       └── gamification.ts    # GET /api/badges, /api/streak
│   └── package.json
├── src/                           # React frontend
│   ├── api/                       # API client layer (replaces localStorage calls)
│   │   ├── client.ts              # fetch wrapper with auth headers + token refresh
│   │   ├── wishes.ts
│   │   ├── tasks.ts
│   │   ├── profile.ts
│   │   ├── weather.ts
│   │   └── gamification.ts
│   ├── context/
│   │   └── AuthContext.tsx        # User session state, login/logout/refresh
│   ├── hooks/
│   │   ├── useWishes.ts
│   │   ├── useTasks.ts
│   │   ├── useWeather.ts
│   │   ├── useProfile.ts
│   │   └── useGamification.ts
│   ├── components/
│   │   ├── OnboardingTour.tsx
│   │   ├── WeekView.tsx
│   │   ├── DragDropCalendar.tsx
│   │   ├── WeatherIcon.tsx
│   │   ├── ForecastRow.tsx
│   │   ├── ProgressDashboard.tsx
│   │   ├── BadgeDisplay.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── NotificationBanner.tsx
│   ├── pages/                     # Existing pages (updated)
│   │   ├── HomePage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── WeatherPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── weatherUtils.ts
│   │   └── gamificationUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .prettierrc
├── vite.config.ts
└── package.json
```

---

## 3. Database Schema (SQLite)

```sql
-- Users
CREATE TABLE users (
  id         TEXT PRIMARY KEY,          -- UUID v4
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,             -- bcrypt hash
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens (for "logout everywhere")
CREATE TABLE refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Wishes
CREATE TABLE wishes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  progress   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tasks / Calendar events
CREATE TABLE tasks (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  deadline   TEXT,
  notes      TEXT DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'Dreams',
  priority   TEXT NOT NULL DEFAULT 'Medium',
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Profile
CREATE TABLE profiles (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL,
  name      TEXT NOT NULL,
  bio       TEXT DEFAULT '',
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  email_notifications INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Weather preferences
CREATE TABLE weather_prefs (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  location_history TEXT NOT NULL DEFAULT '[]'  -- JSON array of up to 5 city strings
);

-- Badges
CREATE TABLE badges (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_key  TEXT NOT NULL,                    -- e.g. 'first_wish', 'streak_7'
  awarded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Streaks
CREATE TABLE streaks (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_active    TEXT,                         -- ISO date string YYYY-MM-DD
  longest_streak INTEGER NOT NULL DEFAULT 0
);
```

---

## 4. Backend API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account, return access + refresh tokens |
| POST | `/login` | Verify credentials, return access + refresh tokens |
| POST | `/refresh` | Exchange refresh token for new access token |
| POST | `/logout` | Invalidate current refresh token |
| POST | `/logout-all` | Invalidate all refresh tokens for the user |
| POST | `/reset-password` | Send password reset email |

### Wishes (`/api/wishes`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all wishes for authenticated user |
| POST | `/` | Create a wish |
| PUT | `/:id` | Update wish title or progress |
| DELETE | `/:id` | Delete a wish |

### Tasks (`/api/tasks`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all tasks for authenticated user |
| POST | `/` | Create a task |
| PUT | `/:id` | Update task fields (including date for drag-drop) |
| DELETE | `/:id` | Delete a task |

### Profile (`/api/profile`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get profile for authenticated user |
| PUT | `/` | Update name, email, bio, onboarding_done, email_notifications |

### Weather Prefs (`/api/weather-prefs`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get location history |
| PUT | `/` | Update location history (max 5 cities) |

### Gamification (`/api/gamification`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/badges` | List all badges earned by user |
| GET | `/streak` | Get current and longest streak |
| POST | `/complete` | Record a completion event (wish or task), trigger badge + streak evaluation |

---

## 5. Authentication Flow

### Registration
1. Client POSTs `{ name, email, password }` to `/api/auth/register`
2. Server validates email format (RFC 5321) and password strength (≥8 chars, uppercase, lowercase, digit)
3. Server hashes password with `bcrypt` (cost factor 12)
4. Server creates `users` + `profiles` + `streaks` records
5. Server issues `accessToken` (JWT, 60 min expiry) and `refreshToken` (random UUID, stored as bcrypt hash in `refresh_tokens`, 30 day expiry)
6. Client stores `accessToken` in memory; if "Remember Me" checked, stores `refreshToken` in HttpOnly cookie; otherwise in sessionStorage

### Login
1. Client POSTs `{ email, password }` to `/api/auth/login`
2. Server checks rate limit (5 failures / 15 min / IP → 15 min block)
3. Server looks up user by email, compares bcrypt hash
4. On match: issues new `accessToken` + `refreshToken`, same storage as registration
5. On failure: returns generic "Invalid credentials" (no field hint)

### Token Refresh
- `client.ts` intercepts 401 responses, calls `/api/auth/refresh` with the refresh token, updates in-memory `accessToken`, retries original request

### Logout Everywhere
- Client POSTs to `/api/auth/logout-all` → server deletes all rows in `refresh_tokens` for the user

---

## 6. Frontend API Client (`src/api/client.ts`)

```typescript
// Singleton fetch wrapper
// - Attaches Authorization: Bearer <accessToken> header
// - On 401: attempts token refresh, retries once
// - On network error: throws typed ApiError
export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T>
```

Each domain module (`wishes.ts`, `tasks.ts`, etc.) wraps `apiRequest` with typed parameters and return shapes, matching the DB schema.

---

## 7. Auth Context (`src/context/AuthContext.tsx`)

```typescript
interface AuthContextValue {
  user: { id: string; name: string; email: string } | null;
  accessToken: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
}
```

- Wraps entire app in `<AuthContext.Provider>`
- On mount: if refresh token cookie exists, calls `/api/auth/refresh` to restore session silently
- All protected routes check `user !== null`; redirect to `/login` otherwise

---

## 8. Calendar Enhancements

### Week View (`src/components/WeekView.tsx`)
- Renders 7 columns (Sun–Sat) for the current week anchored to `selectedDate`
- Each column lists Task cards for that day, sorted by priority then deadline
- Navigation: "Prev week" / "Next week" buttons

### Drag-and-Drop (`src/components/DragDropCalendar.tsx`)
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Each Task card is a `<Draggable>` with `taskId` as data
- Each day column is a `<Droppable>` with the ISO date as data
- On drop: calls `PUT /api/tasks/:id` with the new `date`
- Works in both month view and week view

### Daily Agenda
- Section at top of CalendarPage listing today's tasks
- Sorted: priority descending (High → Low), then deadline ascending
- Shows "Due soon" / "Overdue" badges inline

---

## 9. Weather Upgrade

### Data Source
- **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search` (free, no key)
- **Weather + Forecast**: `https://api.open-meteo.com/v1/forecast` with params:
  - `current_weather=true`
  - `daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset`
  - `hourly=relativehumidity_2m`
  - `timezone=auto`
- If `VITE_WEATHER_API_KEY` env var is set, uses WeatherAPI.com instead (richer data)

### Weather Icons (`src/components/WeatherIcon.tsx`)
- Maps WMO weather codes to SVG emoji-style icons (no external icon font dependency)
- Code ranges: 0–1 sunny, 2–3 cloudy, 45–48 foggy, 51–67 rainy, 71–77 snowy, 80–82 showery, 95–99 stormy

### Dynamic Backgrounds
- CSS classes applied to `.weather-page`: `sunny`, `cloudy`, `rainy`, `snowy`, `stormy`
- Each class uses a CSS `@keyframes` animation on a `::before` pseudo-element

### Forecast Row (`src/components/ForecastRow.tsx`)
- Horizontally scrollable flex row of 7 day cards
- Each card: short day label, `<WeatherIcon>`, high/low temps
- Sunrise/sunset displayed below the current conditions card

---

## 10. UI/UX Improvements

### Page Transitions
- `App.tsx` wraps `<Routes>` with a CSS transition class applied on route change
- Fade-in + slight upward translate, 200ms ease-out

### Card Entry Animations
- Wish cards and task cards use CSS `@keyframes slideInUp` on mount
- Remove animation uses `slideOutDown` with a 200ms delay before DOM removal

### Responsive Layout
- `styles.css` uses CSS Grid with `grid-template-columns` media queries:
  - `< 600px`: 1 column
  - `600px–1024px`: 2 columns
  - `> 1024px`: 3+ columns (wish grid, forecast row, stats row)

### Onboarding Tour (`src/components/OnboardingTour.tsx`)
- Array of steps: `{ target: string; title: string; body: string }`
- Each step highlights the target element with a semi-transparent overlay + tooltip
- "Next" / "Skip" controls
- On dismiss: calls `PUT /api/profile` with `{ onboarding_done: true }`
- Only shown when `profile.onboarding_done === false`

### Loading Skeleton (`src/components/LoadingSkeleton.tsx`)
- Renders animated grey shimmer blocks matching the shape of wish cards / task cards
- Used by `useWishes`, `useTasks`, `useProfile` hooks while `isLoading` is true

---

## 11. Gamification

### Badge Engine (`src/utils/gamificationUtils.ts`)

```typescript
const BADGE_RULES: BadgeRule[] = [
  { key: 'first_wish',  label: '🌱 First Wish',   condition: (stats) => stats.wishesCompleted >= 1 },
  { key: 'dream_keeper',label: '🏆 Dream Keeper', condition: (stats) => stats.wishesCompleted >= 10 },
  { key: 'streak_3',   label: '🔥 3-Day Streak',  condition: (stats) => stats.currentStreak >= 3 },
  { key: 'streak_7',   label: '⚡ 7-Day Streak',  condition: (stats) => stats.currentStreak >= 7 },
  { key: 'streak_14',  label: '💎 14-Day Streak', condition: (stats) => stats.currentStreak >= 14 },
  { key: 'streak_30',  label: '🌟 30-Day Streak', condition: (stats) => stats.currentStreak >= 30 },
];
```

- `POST /api/gamification/complete` is called whenever a wish reaches 100% or a task is marked done
- Server evaluates all badge rules against the user's current stats
- Any newly qualifying badge is inserted into `badges` table
- Response includes `newBadges[]` and updated `streak`

### Streak Tracker
- Server reads `streaks.last_active` for the user
- If `last_active` is yesterday → increment `current_streak`
- If `last_active` is today → no change
- If `last_active` is older or null → reset to 1
- Updates `longest_streak` if `current_streak` exceeds it

### Progress Dashboard (`src/components/ProgressDashboard.tsx`)
- Stats row: total wishes, completed wishes, avg progress %, current streak
- Weekly chart: `<WeeklyChart>` using plain SVG (no chart library dependency) — bar chart, 4 weeks of data
- Today's Wins list: filtered from wishes + tasks completed today
- Badge shelf: horizontal scroll of earned badge cards

---

## 12. Testing Setup

### Framework
- **Vitest** (compatible with Vite, fast, ESM-native)
- **@testing-library/react** for component tests
- **@testing-library/user-event** for interaction simulation
- **msw** (Mock Service Worker) for API mocking in integration tests
- **fast-check** for property-based tests

### Test File Locations
```
src/
  utils/
    dateUtils.test.ts        # unit + property-based
    weatherUtils.test.ts     # unit + property-based
    gamificationUtils.test.ts
  components/
    OnboardingTour.test.tsx
    WeatherIcon.test.tsx
    WeekView.test.tsx
  pages/
    HomePage.test.tsx
    CalendarPage.test.tsx
    WeatherPage.test.tsx
    LoginPage.test.tsx
    RegisterPage.test.tsx
  integration/
    authFlow.test.tsx
    wishFlow.test.tsx
    taskFlow.test.tsx
```

### Coverage Targets
- Utility functions: ≥ 80%
- React components: ≥ 70%

---

## 13. Linting and Formatting

### ESLint (`.eslintrc.cjs`)
- `eslint:recommended` + `plugin:@typescript-eslint/recommended` + `plugin:react-hooks/recommended`
- `plugin:jsx-a11y/recommended` for accessibility

### Prettier (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 14. Environment Configuration

### `.env.development`
```
VITE_API_BASE_URL=http://localhost:3001
VITE_WEATHER_API_KEY=           # optional — leave blank to use Open-Meteo
```

### `.env.production`
```
VITE_API_BASE_URL=https://api.onewishwillow.app
VITE_WEATHER_API_KEY=<set in hosting platform secrets>
VITE_ANALYTICS_KEY=<set in hosting platform secrets>
```

### Server `.env`
```
PORT=3001
JWT_SECRET=<random 64-char hex>
JWT_REFRESH_SECRET=<random 64-char hex>
DB_PATH=./data/willow.db
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@onewishwillow.app
EMAIL_PASS=<secret>
CORS_ORIGIN=http://localhost:5173
```

---

## 15. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  ci:
    steps:
      - checkout
      - setup Node 20
      - npm ci (root + server)
      - eslint --max-warnings 0
      - prettier --check
      - vitest run --coverage
      - tsc --noEmit
      - vite build
  deploy-frontend:       # runs on main branch only
    needs: ci
    steps:
      - deploy to Vercel via vercel CLI
  deploy-backend:        # runs on main branch only
    needs: ci
    steps:
      - deploy server/ to Railway via railway CLI
  smoke-test:
    needs: [deploy-frontend, deploy-backend]
    steps:
      - curl production URL, assert 200 + "One Wish Willow" in body
```

---

## 16. Deployment Targets

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend (SPA) | Vercel | Auto-detects Vite, zero-config |
| Backend (API) | Railway | Node 20, auto-deploys from `server/` dir |
| Database | SQLite file on Railway volume | Can migrate to Railway's Postgres addon later |
| Email | SMTP via nodemailer | Gmail / SendGrid / Mailgun in prod |

---

## 17. Key Dependencies (additions to current stack)

### Frontend additions
| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop calendar |
| `vitest` | Test runner |
| `@testing-library/react` | Component tests |
| `@testing-library/user-event` | User interaction simulation |
| `msw` | API mocking |
| `fast-check` | Property-based tests |
| `eslint` + `@typescript-eslint/eslint-plugin` | Linting |
| `prettier` | Formatting |
| `eslint-plugin-jsx-a11y` | Accessibility linting |

### Backend (new `server/` package)
| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `better-sqlite3` | SQLite database |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT issuance and verification |
| `express-rate-limit` | Login rate limiting |
| `nodemailer` | Email notifications |
| `cors` | CORS headers |
| `dotenv` | Environment config |
| `tsx` | TypeScript execution for development |
