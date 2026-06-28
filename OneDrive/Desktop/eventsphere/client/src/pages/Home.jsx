import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: 90, paddingBottom: 90, textAlign: 'center' }}>
      <p style={{ color: 'var(--accent-cyan)', letterSpacing: '0.08em', fontWeight: 700, fontSize: '0.82rem', marginBottom: 14 }}>
        SMART LOCATION-BASED EVENT MANAGEMENT
      </p>
      <h1 style={{ fontSize: '3rem', marginBottom: 18 }}>
        Event<span style={{ color: 'var(--accent-purple)' }}>Sphere</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
        A hyper-local ecosystem where discovery meets convenience. Connect with nearby events,
        manage bookings, and foster community interactions in real time.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <Link to="/events" className="btn btn-primary">Discover events</Link>
        <Link to="/signup" className="btn btn-secondary">Host an event</Link>
      </div>
    </div>
  );
}
