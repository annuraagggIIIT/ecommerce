import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to E-Commerce</h1>
        <p>Discover amazing products at great prices</p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary btn-large">
            Browse Products
          </Link>
          {!isAuthenticated && (
            <Link to="/signup" className="btn btn-secondary btn-large">
              Sign Up
            </Link>
          )}
        </div>
      </section>

      {isAuthenticated && (
        <section className="welcome-section">
          <h2>Hello, {user?.name}!</h2>
          <p>What would you like to do today?</p>
          <div className="quick-links">
            <Link to="/products" className="quick-link-card">
              <h3>Browse Products</h3>
              <p>Explore our catalog</p>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin/products" className="quick-link-card">
                <h3>Manage Products</h3>
                <p>Add, edit, or remove products</p>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Quality Products</h3>
            <p>We offer only the best quality products for our customers.</p>
          </div>
          <div className="feature-card">
            <h3>Fast Shipping</h3>
            <p>Get your orders delivered quickly and efficiently.</p>
          </div>
          <div className="feature-card">
            <h3>Great Support</h3>
            <p>Our customer support team is here to help you 24/7.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
