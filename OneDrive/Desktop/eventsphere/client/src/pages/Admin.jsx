import { useEffect, useState } from 'react';
import { adminApi } from '../api/endpoints';

export default function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [qrInput, setQrInput] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  const [checkInError, setCheckInError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, r] = await Promise.all([adminApi.dashboard(), adminApi.requests('pending')]);
      setDashboard(d);
      setRequests(r.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onReview = async (requestId, decision) => {
    try {
      await adminApi.reviewRequest(requestId, decision);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const onCheckIn = async (e) => {
    e.preventDefault();
    setCheckInError('');
    setCheckInResult(null);
    try {
      const result = await adminApi.checkIn(qrInput.trim());
      setCheckInResult(result);
      setQrInput('');
    } catch (err) {
      setCheckInError(err.message);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <h1 style={{ fontSize: '1.9rem', marginBottom: 28 }}>Command Center</h1>

      {error && <div className="error-banner">{error}</div>}

      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total users" value={dashboard.totalUsers} />
          <StatCard label="Pending requests" value={dashboard.pendingRequests} accent="var(--warning)" />
          <StatCard label="Total revenue" value={`$${Number(dashboard.totalRevenue).toFixed(2)}`} accent="var(--success)" />
          <StatCard
            label="Tickets used"
            value={dashboard.ticketsByStatus.find((s) => s.status === 'used')?.count || 0}
            accent="var(--accent-cyan)"
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>Pending event requests</h2>
          {requests.length === 0 ? (
            <div className="empty-state">No pending requests. Caught up!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map((r) => (
                <div key={r.request_id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{r.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                        {r.venue} · {r.city} · {new Date(r.event_date).toLocaleDateString()}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        By {r.organizer_name} ({r.organizer_email}) · {r.total_seats} seats
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" onClick={() => onReview(r.request_id, 'approved')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => onReview(r.request_id, 'rejected')}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>QR check-in</h2>
          <div className="card">
            <form onSubmit={onCheckIn}>
              <div className="field">
                <label className="label">Scanned QR value / ticket hash</label>
                <input className="input" value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Paste QR hash" required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Check in</button>
            </form>
            {checkInError && <div className="error-banner" style={{ marginTop: 14 }}>{checkInError}</div>}
            {checkInResult && <div className="success-banner" style={{ marginTop: 14 }}>{checkInResult.message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = 'var(--accent-purple)' }) {
  return (
    <div className="card">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: accent, margin: 0 }}>{value}</p>
    </div>
  );
}
