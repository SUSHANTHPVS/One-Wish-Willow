# One Wish Willow

## Local Development

Install dependencies with `npm install`. Configure your local environment using
the variable names in [.env.example](.env.example), then run `npm run dev` and
`npm run server` in separate terminals. Never commit your local environment file.

## Website Logo

The shared brand logo uses `public/Willow Serenity Landscape Emblem.png`.
It appears in public and signed-in headers, authentication pages, the landing
page hero/footer, and the home page. Browser tabs use `public/willow-favicon.png`;
`public/willow-touch-icon.png` supplies the mobile home-screen icon.

Page headings also include decorative, topic-specific illustrations using the
shared `src/components/PageTitle.tsx` component. These pastel icons scale for
mobile screens and keep the willow logo and browser-tab icon unchanged.
Other page headers now include larger flat-color artwork through
`src/components/PageIllustration.tsx`, matching the existing Calendar and
Weather illustrations. Home and the landing hero retain the requested willow logo.

## Public Information Pages

Visitors can read `/terms`, `/privacy`, and `/contact` without signing in.
Each feature guide has its own public page: `/features/goals`,
`/features/fitness`, `/features/mental-health`, and `/features/music`.
Landing-page footer links open these pages directly, and each information page
includes a return-to-home control. Signed-in feature tools keep their existing routes.

The privacy page describes current account storage, browser-local wellness data,
and external service requests. Review this content and verify the listed support
email before publishing; it is not a substitute for legal review.

## Google Sign-In

1. In Google Cloud Console, configure the OAuth consent screen and create an
	OAuth client with application type **Web application**.
2. Add your frontend origins to **Authorized JavaScript origins**:
	`http://localhost:5173`, `http://127.0.0.1:5173`, and your deployed frontend
	origin. Origins must match exactly, including the port, and must not contain
	page paths. Add test users if the consent screen is in testing mode.
3. Set `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on the
	frontend to the same OAuth client ID. This is a public client ID, not an API
	key. No Google client secret is needed for this identity-token popup flow.
4. Restart both local servers. For production, set these variables in the
	relevant hosting environments and rebuild/redeploy both services. Set
	`VITE_API_BASE_URL` to your deployed backend URL, not localhost.

Google sign-in remains disabled until its client ID is configured. Google
registration requires accepting Terms and Conditions first. Returning Google
users can use either authentication page. The backend verifies Google's token
signature, audience, issuer, expiration, and verified email before issuing an
application session. Google-created accounts use Google sign-in rather than a
generated user-facing password. Existing password accounts retain their password
when linked to an authoritative Google email identity.

## Notifications

Signed-in users have an in-app notification center in the header. Alerts come
from completed wishes, today's date-only calendar events, deadlines within the
next 24 hours, and incomplete deadlines from the last seven days. The center
refreshes every 15 seconds while the app is visible, on returning to the app,
and after successful saves. Read and dismissed states persist per account in
MongoDB; reminders for completed or deleted events disappear automatically.

Calendar events now use the authenticated backend. Previously browser-only
events are imported when their owner opens Calendar, with stable import IDs to
avoid duplicates. The local copies are removed only after a successful import.
Notification controls support individual and bulk mark-read, dismissal, an
unread filter, and direct links to Calendar or Wish List.

These are in-app notifications. Delivery while the site is closed, email,
and browser push notifications are not configured.

## Profile Pictures

New profile pictures are validated PNG, JPEG, GIF, or WebP uploads (up to 5MB)
stored with the user's MongoDB record. They no longer depend on Render's
temporary filesystem and remain available after refreshes and redeployments.
Removing a picture also updates the database.

After deploying this fix to both services, upload your picture once again if
the previous file has already disappeared. Older local file paths are resolved
against the backend URL when their files are still available.

## Account Deletion and Recovery

Profile's Data & Account tab offers account deletion and temporary termination.
Both require explicit confirmation, revoke existing sessions, and schedule permanent
deletion after exactly 7 days. Password or Google sign-in before the deadline
cancels the request and restores access. Acknowledgements show the deletion deadline.
Expired accounts cannot sign in or be restored.

The backend checks for expired accounts at startup and every minute while running.
Cleanup removes user-owned MongoDB records before deleting the account. Failed
cleanup is logged and retried; deadlines survive restarts. If the server is offline,
physical removal waits until it is running again. Browser-local wellness records
are not removed by this job; users can clear this site's browser data separately.

The entire application uses light mode only; old stored dark-theme preferences are
removed and no theme switches are shown.

## Checks

- `npm run build`
- `node --test server/accountLifecycle.test.js server/googleAuth.test.js server/statistics.test.js server/notifications.test.js server/profilePicture.test.js`

To run account lifecycle integration tests in PowerShell:

```powershell
$env:RUN_ACCOUNT_INTEGRATION = '1'
node --test server/accountLifecycle.integration.test.js
```

These tests use the configured MongoDB server with a uniquely named test database,
start an isolated backend on a temporary port, and remove the test database afterward.
They verify exact deadline boundaries, cleanup of every user-owned collection,
cleanup retries, and authenticated deletion/recovery HTTP flows. The database user
must have permission to create and drop the test database.
