import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ticketsApi } from '../api/endpoints';

const STATUS_CLASS = {
  valid: 'badge-approved',
  used: 'badge-completed',
  cancelled: 'badge-cancelled',
  refunded: 'badge-rejected',
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketsApi.mine()
      .then(({ tickets }) => setTickets(tickets))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <h1 style={{ fontSize: '1.9rem', marginBottom: 28 }}>My tickets</h1>

      {error && <div className="error-banner">{error}</div>}

      {tickets.length === 0 ? (
        <div className="empty-state">You haven't booked any tickets yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {tickets.map((t) => (
            <div key={t.ticket_id} className="card" style={{ textAlign: 'center' }}>
              <span className={`badge ${STATUS_CLASS[t.status] || ''}`}>{t.status}</span>
              <h3 style={{ margin: '12px 0 4px' }}>{t.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 2 }}>{t.venue} · {t.city}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: 16 }}>
                {new Date(t.event_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>

              <div style={{ background: 'white', display: 'inline-block', padding: 12, borderRadius: 12, marginBottom: 14 }}>
                <QRCodeSVG value={t.qr_hash} size={140} />
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {t.ticket_type} · ${Number(t.price).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
