import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { eventsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function EventChat({ eventId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    eventsApi.messages(eventId).then(({ messages }) => setMessages(messages)).catch(() => {});
  }, [eventId]);

  useEffect(() => {
    if (!user) return undefined;
    const token = localStorage.getItem('es_token');
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_event', eventId);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('new_message', (msg) => {
      if (Number(msg.event_id) === Number(eventId)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.emit('leave_event', eventId);
      socket.disconnect();
    };
  }, [eventId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { eventId, content: text.trim() });
    setText('');
  };

  if (!user) {
    return <p style={{ color: 'var(--text-secondary)' }}>Log in to join the conversation about this event.</p>;
  }

  return (
    <div>
      <div style={styles.list}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.message_id} style={styles.message}>
            <span style={styles.sender}>{m.sender_name}</span>
            <span style={styles.content}>{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <input
          className="input"
          placeholder={connected ? 'Type a message…' : 'Connecting…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!connected}
        />
        <button className="btn btn-primary" type="submit" disabled={!connected || !text.trim()}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  list: {
    maxHeight: 260,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingRight: 4,
  },
  message: { display: 'flex', flexDirection: 'column', gap: 2 },
  sender: { fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)' },
  content: { fontSize: '0.92rem', color: 'var(--text-primary)' },
};
