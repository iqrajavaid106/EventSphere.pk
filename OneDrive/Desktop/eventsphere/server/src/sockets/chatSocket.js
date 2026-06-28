const { verify } = require('../utils/jwt');
const db = require('../config/db');

/**
 * Wires up Socket.IO for per-event live chat rooms.
 * Client flow:
 *   1. connect with `auth: { token }`
 *   2. emit 'join_event', eventId
 *   3. emit 'send_message', { eventId, content }
 *   4. listen for 'new_message' and 'chat_error'
 */
function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verify(token);
      socket.user = { userId: decoded.userId, role: decoded.role };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_event', (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave_event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('send_message', async ({ eventId, content }) => {
      try {
        if (!eventId || !content || !content.trim()) {
          return socket.emit('chat_error', { error: 'eventId and content are required' });
        }

        const result = await db.query(
          `INSERT INTO messages (event_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING message_id, content, created_at`,
          [eventId, socket.user.userId, content.trim()]
        );

        const userResult = await db.query(
          `SELECT full_name FROM users WHERE user_id = $1`,
          [socket.user.userId]
        );

        const message = {
          ...result.rows[0],
          event_id: eventId,
          sender_id: socket.user.userId,
          sender_name: userResult.rows[0]?.full_name || 'Unknown',
        };

        io.to(`event:${eventId}`).emit('new_message', message);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('chat_error', { error: 'Failed to send message' });
      }
    });
  });
}

module.exports = initSocket;
