import PageTitle from '../components/PageTitle';

export default function MentalHealthInfoPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="mental-health" illustrated><h1>Mental Health</h1></PageTitle>
        <p>Make space for a daily check-in. Record your mood, stress level, and optional notes, then explore gentle suggestions such as journaling, taking a walk, or connecting with someone you trust.</p>
        <section className="terms-section">
          <h2>A space for self-reflection</h2>
          <ul>
            <li>Review past check-ins to reflect on patterns in your mood and stress.</li>
            <li>Choose suggestions that feel appropriate for you; there is no pressure to complete them.</li>
            <li>Keep sensitive details out of notes on shared devices, since check-ins are saved in your browser.</li>
          </ul>
          <p>This is a self-reflection tool, not a diagnosis, therapy service, or monitored crisis channel. If you are in immediate danger or need urgent help, contact your local emergency services or a qualified crisis support service.</p>
        </section>
      </div>
    </section>
  );
}
