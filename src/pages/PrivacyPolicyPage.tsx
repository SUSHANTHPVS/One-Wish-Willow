import { Link } from 'react-router-dom';
import PageTitle from '../components/PageTitle';

export default function PrivacyPolicyPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="privacy" illustrated><h1>Privacy Policy</h1></PageTitle>
        <p className="last-updated">Last Updated: October 31, 2026</p>
        <p>This page explains how One Wish Willow currently handles information when you create an account and use its wellness tools.</p>

        <section className="terms-section">
          <h2>Information saved to your account</h2>
          <p>Registration uses a username, email address, and password. Passwords are stored as bcrypt hashes rather than plain text. If you sign in with Google, the backend verifies your Google identity before creating an application session.</p>
          <p>Your profile may include an email address, bio, language preference, and optional profile picture. Account data, wishes, calendar events, and notification states are stored in the application's MongoDB database so they can be retrieved when you sign in.</p>
        </section>

        <section className="terms-section">
          <h2>Information stored in your browser</h2>
          <p>The website uses local storage to keep your sign-in session, including its access token. The application uses light mode only. Session storage remembers whether you have seen the opening animation.</p>
          <p>Fitness logs and targets, mental-health check-ins and notes, and music playlists and provider preferences are currently saved in browser local storage under your username. These records do not automatically sync to other devices and may be lost if you clear browser data.</p>
          <p>Signing out removes the active sign-in session, but does not erase these locally saved wellness records. On a shared device, avoid entering sensitive information and clear the site's browser data when you no longer need it.</p>
        </section>

        <section className="terms-section">
          <h2>How information is used</h2>
          <ul>
            <li>Authenticate your account and load your saved profile, wishes, and events.</li>
            <li>Show progress summaries and in-app reminders from your saved goals and calendar.</li>
            <li>Remember preferences and display your activity logs, check-ins, and playlists.</li>
          </ul>
          <p>Only enter information you are comfortable storing in the app. Wellness notes are not a confidential clinical record and are not monitored by healthcare professionals.</p>
        </section>

        <section className="terms-section">
          <h2>Third-party services</h2>
          <p>Google sign-in is provided by Google. The site also loads fonts from Google Fonts. These services receive requests from your browser and apply their own privacy policies.</p>
          <p>Music links open external provider websites. Translation requests send the text and language choices to configured translation services, which may include Google Translate, LibreTranslate, or Argos Open Tech. Do not submit confidential text for translation.</p>
          <p>Weather lookup sends a city query or coordinates to Open-Meteo. Location-based lookup also sends coordinates to OpenStreetMap's Nominatim service for place names. Your selected location and weather results are saved in this browser. Information you provide to external services is subject to their policies, not just this page.</p>
        </section>

        <section className="terms-section">
          <h2>Your choices and deletion questions</h2>
          <p>You can edit your profile, remove your profile picture, and delete wishes and calendar events using the corresponding app controls. You can remove locally saved records through available page controls or clear this site's browser storage; clearing browser storage does not delete your server-side account.</p>
          <p>In Profile, open Data &amp; Account to request account deletion or temporary termination and explicitly confirm your choice. Both options sign you out and schedule permanent deletion after 7 days. Signing in with your password or Google before the deadline cancels the request and restores normal access. After the deadline, the account cannot be recovered.</p>
          <p>The server removes expired accounts and their associated records on its next cleanup run, including after restarting. Signing out or deleting your server-side account does not erase browser-local wellness records; clear the site's browser data separately if needed. For other privacy questions, use <Link to="/contact">Contact Us</Link>.</p>
        </section>

        <section className="terms-section">
          <h2>Security and policy updates</h2>
          <p>Keep your password and access tokens private. No online service can guarantee absolute security. Avoid signing in on devices you do not trust.</p>
          <p>This page may be updated when the application's data handling changes. Check the last-updated date and review the <Link to="/terms">Terms &amp; Conditions</Link> alongside this policy.</p>
        </section>
      </div>
    </section>
  );
}
