import { Link } from 'react-router-dom';

const CATEGORY_LABELS = {
  concert: 'Concert',
  tech_workshop: 'Tech Workshop',
  food_festival: 'Food Festival',
  sports: 'Sports',
  bootcamp: 'Bootcamp',
  other: 'Other',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function EventCard({ event }) {
  return (
    <Link to={`/events/${event.event_id}`} className="card" style={styles.card}>
      <div style={styles.topRow}>
        <span className="badge badge-approved" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
          {CATEGORY_LABELS[event.category] || event.category}
        </span>
        {event.distance_km != null && (
          <span style={styles.distance}>{Number(event.distance_km).toFixed(1)} km away</span>
        )}
      </div>

      <h3 style={styles.title}>{event.title}</h3>
      <p style={styles.meta}>{event.venue} · {event.city}</p>
      <p style={styles.date}>{formatDate(event.event_date)}</p>

      <div style={styles.footer}>
        <span style={styles.seats}>{event.seats_available} seats left</span>
        <span style={styles.cta}>View details →</span>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'block',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  distance: { fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 },
  title: { fontSize: '1.1rem', marginBottom: 6 },
  meta: { color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 4px' },
  date: { color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  seats: { fontSize: '0.82rem', color: 'var(--text-secondary)' },
  cta: { fontSize: '0.84rem', color: 'var(--accent-purple)', fontWeight: 700 },
};
