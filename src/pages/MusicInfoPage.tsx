import PageTitle from '../components/PageTitle';

export default function MusicInfoPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="music" illustrated><h1>Music</h1></PageTitle>
        <p>Organize playlists by mood and discover music for focus, relaxation, or motivation. The Music page opens searches and listening pages on Spotify, Apple Music, Gaana, and Jio Saavn.</p>
        <section className="terms-section">
          <h2>Find music for your day</h2>
          <ul>
            <li>Save a playlist title, choose a provider, and label it with a mood.</li>
            <li>Use suggestions to explore tracks on your preferred music service.</li>
            <li>Review your locally saved playlists and recent selections.</li>
          </ul>
          <p>Playback happens on the provider's website, not inside One Wish Willow. A provider account or subscription may be required. Provider selections do not connect or authorize your music account, and each provider has its own terms and privacy policy.</p>
        </section>
      </div>
    </section>
  );
}
