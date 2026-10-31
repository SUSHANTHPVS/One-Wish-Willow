import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Zap, Brain, Music, Target, Users } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import PageTitle from '../components/PageTitle';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <nav className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-content">
          <div className="landing-logo brand-lockup">
            <BrandLogo decorative />
            <div>
            <span className="logo-accent">O</span>ne{' '}
            <span className="logo-accent">W</span>ish{' '}
            <span className="logo-accent">W</span>illow
            </div>
          </div>
          <div className="landing-nav-actions">
            <button 
              className="primary-button nav-button"
              onClick={onGetStarted}
              type="button"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <PageTitle topic="home"><h1 className="hero-title">
            Dream. Plan.
            <span className="hero-highlight"> Remember.</span>
          </h1></PageTitle>
          <p className="hero-subtitle">
            Your personal wellness companion for setting goals, staying motivated, and achieving balance in life.
          </p>
          <div className="hero-cta">
            <button 
              className="primary-button hero-button"
              onClick={onGetStarted}
              type="button"
            >
              Start Your Journey
            </button>
            <button 
              className="secondary-button hero-button"
              onClick={() => document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' })}
              type="button"
            >
              Learn More ↓
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-illustration">
            <BrandLogo size="large" />
            <div className="stars-background">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="star" style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-header">
          <h2>Everything You Need to Thrive</h2>
          <p>Comprehensive tools designed to support your wellness journey</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <Target size={32} />
            </div>
            <h3>Goal Setting & Tracking</h3>
            <p>Create your wish list and track progress toward meaningful goals with our intuitive planner.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Heart size={32} />
            </div>
            <h3>Mental Health Support</h3>
            <p>Access mood-based tips, mental health resources, and addiction recovery support whenever you need it.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Zap size={32} />
            </div>
            <h3>Fitness & Wellness</h3>
            <p>Follow personalized fitness plans and build healthy habits that stick with guided routines.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Music size={32} />
            </div>
            <h3>Curated Music</h3>
            <p>Discover music playlists designed to enhance focus, calm your mind, and fuel your motivation.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Brain size={32} />
            </div>
            <h3>AI Assistant</h3>
            <p>Chat with our intelligent assistant for personalized guidance, motivation, and support.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Community Focus</h3>
            <p>Join a supportive community of people working toward their goals and personal growth.</p>
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section className="more-features">
        <div className="more-features-content">
          <div className="more-features-text">
            <h2>A Complete Wellness Platform</h2>
            <p>
              One Wish Willow combines goal setting, fitness tracking, mental health support, and personal development 
              into one intuitive platform. Whether you're working on fitness goals, managing stress, or seeking recovery 
              support, we're here to help you succeed.
            </p>
            <ul className="features-list">
              <li>📅 Smart Calendar Integration</li>
              <li>🌤️ Weather Information for Planning</li>
              <li>📊 Progress Statistics & Analytics</li>
              <li>🌍 Multi-Language Translation</li>
              <li>🎯 Personalized Recommendations</li>
              <li>🔐 Secure & Private</li>
            </ul>
          </div>
          <div className="more-features-visual">
            <div className="feature-showcase">
              <div className="showcase-item">💡</div>
              <div className="showcase-item">🎯</div>
              <div className="showcase-item">🚀</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>Join People Making a Difference</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">
              "One Wish Willow helped me stay committed to my fitness goals. The support and tracking tools are amazing!"
            </p>
            <p className="testimonial-author">— Alex M.</p>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-text">
              "I love how supportive this platform is. The mental health resources made a real difference for me."
            </p>
            <p className="testimonial-author">— Jordan T.</p>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-text">
              "Finally, a wellness app that doesn't judge. It feels like having a supportive friend in your pocket."
            </p>
            <p className="testimonial-author">— Casey R.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Life?</h2>
        <p>Join thousands of people already achieving their wellness goals.</p>
        <button 
          className="primary-button cta-button"
          onClick={onGetStarted}
          type="button"
        >
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <BrandLogo />
            <h4>One Wish Willow</h4>
            <p>Your personal wellness companion for setting goals and staying motivated.</p>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li><Link to="/features/goals">Goal Setting</Link></li>
              <li><Link to="/features/fitness">Fitness Tracking</Link></li>
              <li><Link to="/features/mental-health">Mental Health</Link></li>
              <li><Link to="/features/music">Music</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 One Wish Willow. All Rights Reserved. Inspired by Obsession.</p>
        </div>
      </footer>
    </div>
  );
}
