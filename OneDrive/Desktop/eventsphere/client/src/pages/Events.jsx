import { useEffect, useState, useCallback } from 'react';
import { eventsApi } from '../api/endpoints';
import EventCard from '../components/EventCard';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'concert', label: 'Concerts' },
  { value: 'tech_workshop', label: 'Tech Workshops' },
  { value: 'food_festival', label: 'Food Festivals' },
  { value: 'sports', label: 'Sports' },
  { value: 'bootcamp', label: 'Bootcamps' },
  { value: 'other', label: 'Other' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ city: '', category: '', search: '' });
  const [coords, setCoords] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle | locating | done | denied

    const fetchEvents = useCallback(async (params) => {
        setLoading(true);
        setError('');
        try {
            const events = await eventsApi.list(params);
            setEvents(events);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

  useEffect(() => {
    fetchEvents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUseLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
    setLocStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocStatus('done');
        fetchEvents({ ...filters, ...c, radiusKm: 50 });
      },
      () => setLocStatus('denied'),
      { timeout: 8000 }
    );
  };

  const onApplyFilters = (e) => {
    e.preventDefault();
    fetchEvents({ ...filters, ...(coords || {}) });
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <h1 style={{ fontSize: '1.9rem', marginBottom: 6 }}>Discover nearby events</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        {coords ? 'Showing events sorted by distance from you.' : 'Auto-detect your city or browse manually.'}
      </p>

      <form onSubmit={onApplyFilters} className="card" style={{ marginBottom: 28, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="label">City</label>
          <input
            className="input"
            placeholder="e.g. Lahore"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label className="label">Category</label>
          <select
            className="input"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '2 1 220px' }}>
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Search by name or description"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" type="submit">Apply</button>
        <button type="button" className="btn btn-secondary" onClick={onUseLocation} disabled={locStatus === 'locating'}>
          {locStatus === 'locating' ? 'Locating…' : '📍 Use my location'}
        </button>
      </form>

      {locStatus === 'denied' && (
        <div className="error-banner">Couldn't access your location. You can still filter by city manually.</div>
      )}
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state">No events match your filters yet. Try widening your search.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {events.map((ev) => <EventCard key={ev.event_id} event={ev} />)}
        </div>
      )}
    </div>
  );
}
