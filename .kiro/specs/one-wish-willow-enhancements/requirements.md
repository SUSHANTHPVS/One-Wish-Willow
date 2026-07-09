# Requirements Document

## Introduction

One Wish Willow is a React 18 + TypeScript + Vite personal-productivity app with pages for wishes (HomePage), calendar/tasks (CalendarPage), weather (WeatherPage), and profile (ProfilePage). Currently all state is stored in browser `localStorage` and authentication uses plain-text passwords. This document captures requirements for eight enhancement areas: real backend and persistence, improved authentication, enhanced calendar/task workflow, upgraded weather, improved UI/UX, progress and gamification, testing and quality, and deployment/productionisation.

---

## Glossary

- **App**: The One Wish Willow React 18 + TypeScript + Vite single-page application.
- **API_Server**: The server-side Node/Express or Firebase back end that handles data persistence and business logic.
- **Auth_Service**: The component of the API_Server responsible for user registration, login, token issuance, and session management.
- **DB**: The persistent relational or document database (e.g., PostgreSQL, Firestore) managed by the API_Server.
- **User**: An authenticated person who has completed registration and logged in to the App.
- **Session_Token**: A short-lived JWT or session cookie issued by the Auth_Service upon successful login.
- **Refresh_Token**: A long-lived token used by the App to obtain a new Session_Token without re-entering credentials.
- **Wish**: A goal entry created by a User, consisting of a title and a progress value between 0 and 100.
- **Task**: A calendar/reminder entry created by a User, consisting of a title, date, deadline, category, priority, notes, and completion status.
- **Weather_Prefs**: A User's saved location history and display preferences for the WeatherPage.
- **Profile**: A User's account information including display name, email, and bio.
- **Badge**: A digital reward awarded to a User for reaching a predefined achievement milestone.
- **Streak**: A count of consecutive days on which a User has completed at least one Wish or Task.
- **Notification**: An in-app or email message sent to a User about an upcoming or overdue Task deadline.
- **Onboarding_Tour**: A guided first-use walkthrough shown to a User the first time they access the App after registration.
- **Drag_Drop_Scheduler**: The UI component that lets a User reschedule a Task by dragging its card to a new date on the calendar.
- **Weather_API**: The external weather service (e.g., OpenWeatherMap or WeatherAPI) queried by the API_Server.
- **Analytics_Service**: The third-party or first-party system that records anonymised usage events from the App.
- **CI_Pipeline**: The automated build, lint, test, and deploy workflow executed on each code push.

---

## Requirements

---

### Requirement 1: Real Backend and Persistence

**User Story:** As a User, I want my wishes, tasks, weather preferences, and profile to be saved on a real server, so that my data persists across devices and browsers.

#### Acceptance Criteria

1. THE API_Server SHALL expose REST or GraphQL endpoints for create, read, update, and delete operations on Wishes, Tasks, Weather_Prefs, and Profiles.
2. WHEN a User performs any create, update, or delete action on a Wish or Task, THE App SHALL synchronise the change to the DB via the API_Server within 3 seconds under normal network conditions.
3. THE DB SHALL store each Wish, Task, Weather_Prefs record, and Profile associated with exactly one User record identified by a unique user ID.
4. WHEN the API_Server receives a request without a valid Session_Token, THE API_Server SHALL return HTTP 401 and SHALL NOT return or modify any User data.
5. WHEN the App starts and a valid Session_Token exists, THE App SHALL fetch the User's Wishes, Tasks, Weather_Prefs, and Profile from the API_Server before rendering user-specific content.
6. IF the API_Server returns a network error during a data fetch, THEN THE App SHALL display a descriptive error message and SHALL retain the last successfully loaded data for display.
7. THE App SHALL cease writing Wishes, Tasks, Weather_Prefs, and Profile data to `localStorage` once API_Server persistence is active.
8. WHEN a User's data is migrated from localStorage to the DB, THE API_Server SHALL preserve all existing Wish titles, progress values, Task fields, and Profile fields without data loss.

---

### Requirement 2: Improved Authentication

**User Story:** As a User, I want secure login and registration with email validation and session management, so that my account is protected and easy to access.

#### Acceptance Criteria

1. WHEN a User submits a registration form, THE Auth_Service SHALL hash the password using bcrypt with a minimum cost factor of 12 before storing it in the DB.
2. WHEN a User submits a registration form, THE Auth_Service SHALL validate that the email field conforms to RFC 5321 format and SHALL reject registrations with a malformed email address.
3. WHEN a User successfully logs in, THE Auth_Service SHALL issue a Session_Token with an expiry of no more than 60 minutes and a Refresh_Token with an expiry of no more than 30 days.
4. WHEN a Session_Token expires, THE App SHALL use the Refresh_Token to obtain a new Session_Token without requiring the User to re-enter credentials.
5. WHERE the User enables the "Remember Me" option at login, THE App SHALL store the Refresh_Token in a secure, HttpOnly cookie and SHALL use it to restore the session on the next visit within its 30-day expiry window.
6. WHERE the User does not enable "Remember Me", THE App SHALL store the Session_Token in memory only and SHALL discard it when the browser tab is closed.
7. WHEN a User triggers "Logout everywhere", THE Auth_Service SHALL invalidate all active Session_Tokens and Refresh_Tokens for that User across all devices.
8. IF a login attempt uses an email and password that do not match any DB record, THEN THE Auth_Service SHALL return a generic "Invalid credentials" error and SHALL NOT indicate which field was incorrect.
9. IF a login attempt fails 5 consecutive times within 15 minutes from the same IP address, THEN THE Auth_Service SHALL block further login attempts from that IP address for 15 minutes.
10. THE Auth_Service SHALL enforce a minimum password length of 8 characters and SHALL require at least one uppercase letter, one lowercase letter, and one digit.
11. WHEN a User requests a password reset, THE Auth_Service SHALL send a one-time reset link to the User's registered email address that expires after 30 minutes.

---

### Requirement 3: Enhanced Calendar and Task Workflow

**User Story:** As a User, I want richer task management with a week view, drag-and-drop scheduling, and notifications for due-soon and overdue tasks, so that I can stay organised more effectively.

#### Acceptance Criteria

1. THE App SHALL display a week view on the CalendarPage that shows all Tasks for the current 7-day window, with one column per day.
2. WHEN a User switches between the month view and the week view, THE App SHALL preserve the selected date as the anchor for the newly displayed view.
3. THE Drag_Drop_Scheduler SHALL allow a User to drag a Task card from one date column to another date column on both the month view and the week view.
4. WHEN a Task is dropped onto a new date via the Drag_Drop_Scheduler, THE App SHALL update the Task's date field to the target date and SHALL synchronise the change to the DB.
5. THE App SHALL support five Task categories: Personal, Work, Health, Study, and Dreams, and three Task priorities: Low, Medium, and High — consistent with the existing CalendarPage implementation.
6. WHEN a Task's deadline is within 24 hours and the Task is not complete, THE App SHALL display a "Due soon" in-app Notification banner listing the Task title.
7. WHEN a Task's deadline has passed and the Task is not complete, THE App SHALL display an "Overdue" in-app Notification banner listing the Task title.
8. WHERE a User has enabled email notifications, THE App SHALL send an email Notification to the User's registered address when a Task's deadline is within 24 hours and the Task is not complete.
9. WHERE a User has enabled email notifications, THE App SHALL send an email Notification to the User's registered address when a Task's deadline passes and the Task is not complete.
10. THE App SHALL present a daily agenda section on the CalendarPage that lists all Tasks scheduled for the current calendar day, sorted by priority descending then by deadline ascending.
11. WHEN a User marks a Task as complete, THE App SHALL remove the Task from the overdue and due-soon Notification banners and SHALL display a success celebration message.
12. IF a User attempts to add a Task with an empty title or no date, THEN THE App SHALL display a validation error message and SHALL NOT submit the Task.

---

### Requirement 4: Upgraded Weather

**User Story:** As a User, I want a richer weather experience with forecasts, weather icons, sunrise/sunset times, and dynamic backgrounds, so that I can make better plans around the weather.

#### Acceptance Criteria

1. WHEN a User requests weather for a city, THE App SHALL fetch current conditions, a 7-day daily forecast, and sunrise/sunset times from the Weather_API.
2. THE App SHALL display a weather icon corresponding to the current weather condition code returned by the Weather_API.
3. THE App SHALL display the 7-day forecast as a horizontally scrollable row of day cards, each showing the day label, high/low temperature, and a weather icon.
4. THE App SHALL display the sunrise and sunset times for the User's selected location, formatted in the User's local time zone.
5. WHEN weather conditions include rain, drizzle, snow, or storm, THE App SHALL apply an animated rainy background to the WeatherPage.
6. WHEN weather conditions include clear sky or sun, THE App SHALL apply an animated sunny background to the WeatherPage.
7. WHEN weather conditions include clouds, overcast, or fog, THE App SHALL apply a cloudy background to the WeatherPage.
8. THE App SHALL maintain a location history of up to 5 previously searched cities per User, stored in Weather_Prefs in the DB.
9. WHEN a User selects a city from the location history, THE App SHALL immediately initiate a weather fetch for that city without requiring the User to re-type the name.
10. IF the Weather_API returns an error for a requested city, THEN THE App SHALL display a descriptive error message that does not expose the raw API error payload.
11. THE App SHALL display wind speed in km/h and humidity as a percentage, consistent with the existing WeatherPage implementation.

---

### Requirement 5: Improved UI and UX

**User Story:** As a User, I want a polished, responsive, and welcoming interface with smooth transitions and an onboarding tutorial, so that the App feels delightful on any device.

#### Acceptance Criteria

1. THE App SHALL apply CSS transition animations of between 150 ms and 400 ms duration when navigating between pages.
2. THE App SHALL apply entry animations to wish cards and task cards when they are added to or removed from the DOM.
3. THE App SHALL render all pages without horizontal overflow on viewport widths from 320 px to 2560 px.
4. THE App SHALL present a single-column layout for viewport widths below 600 px, a two-column layout for widths from 600 px to 1024 px, and a multi-column layout for widths above 1024 px.
5. THE App SHALL meet WCAG 2.1 Level AA colour-contrast requirements for all text and interactive elements in both light and dark themes.
6. WHEN a User registers and logs in for the first time, THE App SHALL display the Onboarding_Tour as a sequence of modal tooltip steps highlighting the Wish List, CalendarPage, WeatherPage, and ProfilePage.
7. WHEN a User dismisses the Onboarding_Tour, THE App SHALL record the dismissal in the User's Profile and SHALL NOT show the Onboarding_Tour again on subsequent logins.
8. THE App SHALL display richer illustrative artwork on the HomePage, CalendarPage, and WeatherPage consistent with the existing nature/willow visual language.
9. WHEN a User hovers over or focuses a button or interactive card, THE App SHALL apply a visible focus-ring or hover-lift effect that meets WCAG 2.1 Level AA focus-visibility requirements.
10. THE App SHALL display a loading skeleton or spinner whenever an asynchronous data fetch is in progress, replacing the empty state until data is available.

---

### Requirement 6: Progress and Gamification

**User Story:** As a User, I want to earn badges and see streaks and progress charts, so that completing wishes and tasks feels rewarding and motivating.

#### Acceptance Criteria

1. THE App SHALL track a Streak counter that increments by 1 for each consecutive calendar day on which the User completes at least one Wish or Task.
2. WHEN a User's Streak reaches 3, 7, 14, or 30 days, THE App SHALL award a corresponding Badge and SHALL display a celebratory animation.
3. WHEN a User completes their first Wish, THE App SHALL award a "First Wish" Badge and SHALL display a celebratory animation.
4. WHEN a User completes 10 Wishes, THE App SHALL award a "Dream Keeper" Badge and SHALL display a celebratory animation.
5. THE App SHALL display a progress dashboard on the HomePage showing: total Wishes, completed Wishes, average Wish progress percentage, current Streak, and all earned Badges.
6. THE App SHALL display a bar chart or line chart on the progress dashboard showing the number of Wishes and Tasks completed per week over the past 4 weeks.
7. THE App SHALL display a "Today's Wins" section on the progress dashboard listing all Wishes and Tasks the User has completed on the current calendar day.
8. THE App SHALL display a weekly progress summary showing the count of Wishes and Tasks completed in the current calendar week compared to the previous calendar week.
9. WHEN a User's average Wish progress percentage reaches 50% or 100%, THE App SHALL display a goal-meter milestone celebration notification.
10. THE App SHALL store all Badge records and Streak data in the DB, associated with the User's account, so that progress persists across devices.

---

### Requirement 7: Testing and Quality

**User Story:** As a developer, I want comprehensive automated tests and enforced code style, so that the App remains reliable and maintainable as it grows.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL execute unit tests for all utility functions (date formatting, deadline status calculation, weather condition mapping, and progress computation) and SHALL require all tests to pass before merging.
2. THE CI_Pipeline SHALL execute component tests for all page components (HomePage, CalendarPage, WeatherPage, ProfilePage, LoginPage, RegisterPage) verifying that each renders without errors given representative props and state.
3. THE CI_Pipeline SHALL execute integration tests for the following user flows: registration, login, wish creation and deletion, task creation and completion, weather search, and profile update.
4. THE CI_Pipeline SHALL enforce ESLint rules consistent with the project's TypeScript and React coding conventions and SHALL fail on any ESLint error.
5. THE CI_Pipeline SHALL enforce Prettier formatting rules and SHALL fail if any file does not conform to the configured format.
6. WHEN a pull request reduces test coverage below 80% for utility functions or below 70% for React components, THE CI_Pipeline SHALL report a coverage failure.
7. THE CI_Pipeline SHALL run all unit and component tests in under 60 seconds on standard CI hardware.
8. THE App SHALL include at least one property-based test for each round-trip data transformation, including: JSON serialise/deserialise of Wish and Task objects, date formatting/parsing of event dates and deadlines, and password hashing verification (hash then verify).

---

### Requirement 8: Deployment and Productionisation

**User Story:** As a developer, I want the App deployed to a production hosting platform with environment-based configuration and usage analytics, so that it is reliably accessible to real users.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL build the App using `tsc && vite build` and SHALL deploy the output to Vercel, Netlify, or Azure Static Web Apps on every merge to the main branch.
2. THE App SHALL read all API keys, database connection strings, and theme defaults from environment variables and SHALL NOT hard-code any secret or environment-specific value in source files.
3. THE App SHALL use separate environment variable files for development, staging, and production environments, so that each environment is configured independently.
4. WHEN the App is running in production, THE App SHALL send anonymised usage events (page views, feature interactions) to the Analytics_Service without collecting personally identifiable information.
5. WHERE a User has not consented to analytics tracking, THE App SHALL not send any events to the Analytics_Service.
6. THE API_Server SHALL run behind HTTPS in production and SHALL redirect all HTTP requests to HTTPS.
7. THE CI_Pipeline SHALL perform a build and lint check on every pull request and SHALL block merge if either check fails.
8. THE App SHALL include a `robots.txt` and a `sitemap.xml` appropriate for a single-page application to aid basic SEO and crawler guidance.
9. WHEN a deployment to production completes, THE CI_Pipeline SHALL run a smoke test by fetching the root URL and verifying that the response status is 200 and the response body contains the string "One Wish Willow".
