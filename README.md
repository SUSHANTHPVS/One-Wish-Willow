# One Wish Willow

## Local Development

Install dependencies with `npm install`. Configure your local environment using
the variable names in [.env.example](.env.example), then run `npm run dev` and
`npm run server` in separate terminals. Never commit your local environment file.

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

## Checks

- `npm run build`
- `node --test server/googleAuth.test.js server/statistics.test.js server/notifications.test.js server/profilePicture.test.js`
