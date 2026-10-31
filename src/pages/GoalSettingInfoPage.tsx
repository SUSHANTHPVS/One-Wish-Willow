import PageTitle from '../components/PageTitle';

export default function GoalSettingInfoPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="goals" illustrated><h1>Goal Setting</h1></PageTitle>
        <p>Turn a wish into a practical next step. After signing in, open Wish List to create a goal, update its progress, and remove wishes you no longer need.</p>
        <section className="terms-section">
          <h2>Make progress one step at a time</h2>
          <ul>
            <li>Choose a clear, achievable goal, such as reading a book or building a daily walking habit.</li>
            <li>Update progress as you move toward completion and review your progress in Statistics.</li>
            <li>Use Calendar separately to plan events and deadlines around your goals.</li>
          </ul>
          <p>Your wishes are saved to your account. Calendar reminders appear inside the app; email and push reminders are not currently available.</p>
        </section>
      </div>
    </section>
  );
}
