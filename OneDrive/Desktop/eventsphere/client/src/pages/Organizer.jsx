import { useState } from 'react';
import { eventsApi } from '../api/endpoints';

const CATEGORIES = ['concert', 'tech_workshop', 'food_festival', 'sports', 'bootcamp', 'other'];
const TICKET_NAMES = ['VIP', 'Regular', 'Student'];

const emptyTicketType = () => ({ name: 'Regular', price: '', quantity: '' });

export default function Organizer() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'tech_workshop', venue: '', city: '',
    latitude: '', longitude: '', eventDate: '', totalSeats: '',
  });
  const [ticketTypes, setTicketTypes] = useState([emptyTicketType()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onTicketChange = (idx, field, value) => {
    const next = [...ticketTypes];
    next[idx] = { ...next[idx], [field]: value };
    setTicketTypes(next);
  };

  const addTicketType = () => setTicketTypes([...ticketTypes, emptyTicketType()]);
  const removeTicketType = (idx) => setTicketTypes(ticketTypes.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (ticketTypes.some((t) => !t.price || !t.quantity)) {
      setError('Each ticket type needs a price and quantity.');
      return;
    }

    setSubmitting(true);
    try {
      const { event } = await eventsApi.create({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        totalSeats: Number(form.totalSeats),
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name, price: Number(t.price), quantity: Number(t.quantity),
        })),
      });
      setSuccess(event);
      setForm({
        title: '', description: '', category: 'tech_workshop', venue: '', city: '',
        latitude: '', longitude: '', eventDate: '', totalSeats: '',
      });
      setTicketTypes([emptyTicketType()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.9rem', marginBottom: 6 }}>Host an event</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Submit your event for admin review. Once approved, it goes live to all nearby users instantly.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="success-banner">
          "{success.title}" submitted! Status: <strong>{success.status}</strong>. An admin will review it shortly.
        </div>
      )}

      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label className="label">Event title</label>
          <input className="input" name="title" value={form.title} onChange={onChange} required />
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea className="input" name="description" rows={4} value={form.description} onChange={onChange} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label className="label">Category</label>
            <select className="input" name="category" value={form.category} onChange={onChange}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Date & time</label>
            <input className="input" type="datetime-local" name="eventDate" value={form.eventDate} onChange={onChange} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label className="label">Venue</label>
            <input className="input" name="venue" value={form.venue} onChange={onChange} required />
          </div>
          <div className="field">
            <label className="label">City</label>
            <input className="input" name="city" value={form.city} onChange={onChange} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="field">
            <label className="label">Latitude (optional)</label>
            <input className="input" name="latitude" value={form.latitude} onChange={onChange} placeholder="31.5497" />
          </div>
          <div className="field">
            <label className="label">Longitude (optional)</label>
            <input className="input" name="longitude" value={form.longitude} onChange={onChange} placeholder="74.3436" />
          </div>
          <div className="field">
            <label className="label">Total seats</label>
            <input className="input" type="number" min={1} name="totalSeats" value={form.totalSeats} onChange={onChange} required />
          </div>
        </div>

        <label className="label" style={{ marginTop: 12 }}>Ticket types</label>
        {ticketTypes.map((t, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <select className="input" value={t.name} onChange={(e) => onTicketChange(idx, 'name', e.target.value)}>
              {TICKET_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input className="input" type="number" min={0} step="0.01" placeholder="Price" value={t.price} onChange={(e) => onTicketChange(idx, 'price', e.target.value)} />
            <input className="input" type="number" min={1} placeholder="Quantity" value={t.quantity} onChange={(e) => onTicketChange(idx, 'quantity', e.target.value)} />
            {ticketTypes.length > 1 && (
              <button type="button" className="btn btn-danger" onClick={() => removeTicketType(idx)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={addTicketType} style={{ marginBottom: 24 }}>
          + Add ticket type
        </button>

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
    </div>
  );
}
