import PageTitle from '../components/PageTitle';

export default function ContactPage() {
  return (
    <section className="terms-page">
      <div className="terms-container">
        <PageTitle topic="contact" illustrated><h1>Contact Us</h1></PageTitle>
        <p>Get in touch with questions about One Wish Willow, technical problems, feedback, or privacy requests.</p>
        <section className="terms-section">
          <h2>Contact information</h2>
          <div className="contact-info">
            <p><strong>Email:</strong> <a href="mailto:support@onewishwillow.com">support@onewishwillow.com</a></p>
            <p><strong>Website:</strong> www.onewishwillow.com</p>
          </div>
          <p>Include a short description and the page where the issue occurred. For a bug report, include the steps to reproduce it and your browser version.</p>
          <p>Do not send passwords, sign-in tokens, or sensitive health information. This email is not an emergency support channel.</p>
        </section>
      </div>
    </section>
  );
}
