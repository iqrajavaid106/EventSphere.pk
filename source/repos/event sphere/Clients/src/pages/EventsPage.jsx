console.log("EVENTS PAGE LOADED");
import { useEffect, useState } from 'react';
import '../styles/events.css';

export default function EventsPage() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/events')
            .then(res => res.json())
            .then(data => {
                console.log("✅ DATA RECEIVED:", data);
                setEvents(data);
            })
            .catch(err => {
                console.error("❌ FETCH ERROR:", err);
            });
    }, []);
    console.log("Current events:", events);
    return (
        <div className="events-container">
            <h1 className="page-title">🎉 EventSphere Events</h1>

            <div className="events-grid">
                {events.map(event => (
                    <div className="event-card" key={event.event_id}>
                        <h2>{event.title}</h2>

                        <p>📍 {event.city}</p>

                        <p>🏢 {event.venue}</p>

                        <p>
                            📅 {new Date(event.event_date).toLocaleDateString()}
                        </p>

                        <p>
                            🎟 Seats Available: {event.seats_available}
                        </p>

                        <button className="details-btn">
                            View Details
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
