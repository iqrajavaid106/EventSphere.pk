import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, ticketsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import EventChat from '../components/EventChat';

const GATEWAYS = [
  { value: 'stripe', label: 'Stripe (Card)' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
];

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [gateway, setGateway] = useState('stripe');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    eventsApi.get(id)
      .then(({ event, ticketTypes }) => {
        setEvent(event);
        setTicketTypes(ticketTypes);
        if (ticketTypes.length > 0) setSelectedType(String(ticketTypes[0].ticket_type_id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const onBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setBookingError('');
    setBookingSuccess(null);
    setBooking(true);
    try {
      const result = await ticketsApi.book({
        eventId: Number(id),
        ticketTypeId: Number(selectedType),
        quantity: Number(quantity),
        gateway,
      });
      setBookingSuccess(result);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  }
  if (error || !event) {
    return <div className="container" style={{ paddingTop: 40 }}><div className="error-banner">{error || 'Event not found'}</div></div>;
  }

  const chosenType = ticketTypes.find((t) => String(t.ticket_type_id) === selectedType);
  const remaining = chosenType ? chosenType.quantity - chosenType.quantity_sold : 0;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
      <div>
        <span className="badge badge-approved">{event.category.replace('_', ' ')}</span>
        <h1 style={{ fontSize: '2rem', margin: '14px 0 6px' }}>{event.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{event.venue} · {event.city}</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          {new Date(event.event_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
        </p>

        {event.description && (
          <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 32 }}>{event.description}</p>
        )}

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Live chat</h3>
          <EventChat eventId={id} />
        </div>
      </div>

      <div>
        <div className="card" style={{ position: 'sticky', top: 84 }}>
          <h3 style={{ marginBottom: 16 }}>Book tickets</h3>

          {bookingSuccess ? (
            <div>
              <div className="success-banner">
                Booked {bookingSuccess.tickets.length} ticket(s)! Find your QR codes under "My Tickets".
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/my-tickets')}>
                View my tickets
              </button>
            </div>
          ) : (
            <form onSubmit={onBook}>
              {bookingError && <div className="error-banner">{bookingError}</div>}

              <div className="field">
                <label className="label">Ticket type</label>
                <select className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                  {ticketTypes.map((t) => (
                    <option key={t.ticket_type_id} value={t.ticket_type_id}>
                      {t.name} — ${Number(t.price).toFixed(2)} ({t.quantity - t.quantity_sold} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">Quantity</label>
                <input
                  className="input" type="number" min={1} max={Math.min(10, remaining || 10)}
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label">Payment method</label>
                <select className="input" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                  {GATEWAYS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              {chosenType && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                  Total: <strong style={{ color: 'var(--text-primary)' }}>
                    ${(Number(chosenType.price) * Number(quantity || 0)).toFixed(2)}
                  </strong>
                </p>
              )}

              <button
                className="btn btn-primary" type="submit" style={{ width: '100%' }}
                disabled={booking || !chosenType || remaining < 1}
              >
                {booking ? 'Processing…' : remaining < 1 ? 'Sold out' : user ? 'Confirm booking' : 'Log in to book'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
