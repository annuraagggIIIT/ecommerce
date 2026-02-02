import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Jurassic Park</h1>
        <p>65 Million Years in the Making</p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-large">
            View Dinosaurs
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" className="btn btn-secondary btn-large">
              Register Now
            </Link>
          )}
        </div>
      </section>

      {isAuthenticated && (
        <section className="welcome-section">
          <h2>Welcome Back, {user?.name}!</h2>
          <p>Your prehistoric adventure awaits</p>
          <div className="quick-links">
            <Link to="/products" className="quick-link-card">
              <h3>Explore Species</h3>
              <p>Discover our dinosaur collection</p>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin/products" className="quick-link-card">
                <h3>Lab Control</h3>
                <p>Manage dinosaur specimens</p>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="features">
        <h2>Why Choose Jurassic Park?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Authentic Specimens</h3>
            <p>Cloned from genuine prehistoric DNA preserved in amber.</p>
          </div>
          <div className="feature-card">
            <h3>Secure Containment</h3>
            <p>State-of-the-art electric fences and tracking systems.</p>
          </div>
          <div className="feature-card">
            <h3>Expert Care</h3>
            <p>Our team of paleontologists and geneticists available 24/7.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
