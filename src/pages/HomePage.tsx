import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import PageTitle from '../components/PageTitle';

interface HomePageProps {
  currentUser: string;
}

export default function HomePage({ currentUser }: HomePageProps) {
  return (
    <section className="page-card home-intro-card">
      <div className="page-header home-header">
        <div>
          <PageTitle topic="home"><h2>Welcome to One Wish Willow</h2></PageTitle>
          <p>Discover a caring wellness hub for your goals, mindset, and daily balance.</p>
        </div>
        <BrandLogo size="large" />
      </div>

      <div className="feature-highlights">
        <article className="feature-card">
          <h3>About this website</h3>
          <p>One Wish Willow empowers you to set meaningful goals and stay motivated with thoughtful tools for fitness, mental support, music, and recovery.</p>
        </article>

        <article className="feature-card">
          <h3>What you can do</h3>
          <ul>
            <li>Set goals and manage your wish list with progress tracking.</li>
            <li>Follow fitness plans tailored to your objectives.</li>
            <li>Listen to music that helps you stay focused and calm.</li>
            <li>Chat with a supportive assistant for guidance and encouragement.</li>
            <li>Use mood-based tips for mental health and addiction help.</li>
            <li>Translate text into multiple languages instantly.</li>
          </ul>
        </article>

        <article className="feature-card">
          <h3>Why it works</h3>
          <p>The app brings daily structure, encouragement, and practical support to your wellbeing journey, making it easy to stay inspired and make progress.</p>
        </article>
      </div>

      <div className="home-callout">
        <h3>Start your journey</h3>
        <p>Head to the Wish List page to capture your goals, then explore the other pages to build a holistic wellness routine.</p>
        <Link to="/wish-list" className="primary-button">
          Go to Wish List
        </Link>
      </div>

      <div className="home-welcome-note">
        <p>Hi {currentUser}, this is your space to grow, recharge, and feel supported every day.</p>
      </div>
    </section>
  );
}
