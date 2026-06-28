import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.logo}>
          Event<span style={{ color: 'var(--accent-purple)' }}>Sphere</span>
        </Link>

        <nav style={styles.nav}>
          <Link to="/events" style={styles.link}>Discover</Link>
          {user && <Link to="/my-tickets" style={styles.link}>My Tickets</Link>}
          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <Link to="/organizer" style={styles.link}>Host</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" style={styles.link}>Admin</Link>
          )}
        </nav>

        <div style={styles.actions}>
          {user ? (
            <>
              <span style={styles.userTag}>{user.full_name}</span>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Log in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    background: 'rgba(10,14,26,0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 50,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    gap: 24,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.25rem',
  },
  nav: {
    display: 'flex',
    gap: 20,
    flex: 1,
  },
  link: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userTag: {
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
  },
};
