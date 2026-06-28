const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/events/:id/messages
const getEventMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT m.message_id, m.content, m.created_at, u.user_id AS sender_id, u.full_name AS sender_name
     FROM messages m JOIN users u ON u.user_id = m.sender_id
     WHERE m.event_id = $1
     ORDER BY m.created_at ASC
     LIMIT 200`,
    [id]
  );
  res.json({ messages: result.rows });
});

module.exports = { getEventMessages };
