import PageTitle from '../components/PageTitle';

export default function FitnessInfoPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="fitness" illustrated><h1>Fitness Tracking</h1></PageTitle>
        <p>Choose a fitness focus, set a weekly target in minutes, and keep a record of your activity. The Fitness page offers workout suggestions for strength, endurance, stress relief, weight loss, and general wellness.</p>
        <section className="terms-section">
          <h2>Build your activity routine</h2>
          <ul>
            <li>Log an activity with its date, duration, intensity, and mood.</li>
            <li>Mark workouts complete and review your activity against your weekly target.</li>
            <li>Use suggested routines as starting points, adjusting them to your ability and circumstances.</li>
          </ul>
          <p>Fitness logs and targets are stored in this browser, not synced across devices. Suggestions are general information, not medical advice or a professional training plan. Consult a qualified professional before starting a new routine if you have health concerns.</p>
        </section>
      </div>
    </section>
  );
}
