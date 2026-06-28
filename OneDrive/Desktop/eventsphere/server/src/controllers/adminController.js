const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/admin/requests?status=pending
const listRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const result = await db.query(
    `SELECT r.request_id, r.status, r.review_notes, r.created_at, r.reviewed_at,
            e.event_id, e.title, e.category, e.venue, e.city, e.event_date, e.total_seats,
            u.full_name AS organizer_name, u.email AS organizer_email
     FROM event_requests r
     JOIN events e ON e.event_id = r.event_id
     JOIN users u ON u.user_id = r.submitted_by
     WHERE r.status = $1
     ORDER BY r.created_at ASC`,
    [status]
  );
  res.json({ requests: result.rows });
});

// PATCH /api/admin/requests/:id  body: { decision: 'approved'|'rejected', notes }
const reviewRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body;

  if (!['approved', 'rejected'].includes(decision)) {
    throw new ApiError(400, 'decision must be "approved" or "rejected"');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const reqResult = await client.query(
      `UPDATE event_requests
       SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = now()
       WHERE request_id = $4 AND status = 'pending'
       RETURNING *`,
      [decision, notes || null, req.user.userId, id]
    );
    if (reqResult.rows.length === 0) {
      throw new ApiError(404, 'Request not found or already reviewed');
    }
    const request = reqResult.rows[0];

    const eventStatus = decision === 'approved' ? 'approved' : 'rejected';
    const eventResult = await client.query(
      `UPDATE events SET status = $1, updated_at = now() WHERE event_id = $2 RETURNING *`,
      [eventStatus, request.event_id]
    );

    await client.query('COMMIT');
    res.json({ request, event: eventResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [users, events, tickets, payments, pendingRequests, categoryBreakdown] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS count FROM users'),
    db.query(`SELECT status, COUNT(*)::int AS count FROM events GROUP BY status`),
    db.query(`SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status`),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'success'`),
    db.query(`SELECT COUNT(*)::int AS count FROM event_requests WHERE status = 'pending'`),
    db.query(`
      SELECT e.category, COUNT(t.ticket_id)::int AS tickets_sold
      FROM tickets t JOIN events e ON e.event_id = t.event_id
      GROUP BY e.category ORDER BY tickets_sold DESC
    `),
  ]);

  res.json({
    totalUsers: users.rows[0].count,
    eventsByStatus: events.rows,
    ticketsByStatus: tickets.rows,
    totalRevenue: payments.rows[0].total,
    pendingRequests: pendingRequests.rows[0].count,
    categoryBreakdown: categoryBreakdown.rows,
  });
});

// POST /api/admin/check-in  body: { qrHash }
const checkInTicket = asyncHandler(async (req, res) => {
  const { qrHash } = req.body;
  if (!qrHash) {
    throw new ApiError(400, 'qrHash is required');
  }

  const result = await db.query(
    `SELECT t.*, e.title AS event_title, u.full_name AS owner_name
     FROM tickets t
     JOIN events e ON e.event_id = t.event_id
     JOIN users u ON u.user_id = t.owner_id
     WHERE t.qr_hash = $1`,
    [qrHash]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Ticket not found — invalid QR code');
  }

  const ticket = result.rows[0];

  if (ticket.status === 'used') {
    throw new ApiError(409, `Ticket already checked in at ${ticket.checked_in_at}`);
  }
  if (ticket.status !== 'valid') {
    throw new ApiError(409, `Ticket is not valid (status: ${ticket.status})`);
  }

  const updateResult = await db.query(
    `UPDATE tickets SET status = 'used', checked_in_at = now() WHERE ticket_id = $1 RETURNING *`,
    [ticket.ticket_id]
  );

  res.json({
    message: `Checked in ${ticket.owner_name} for ${ticket.event_title}`,
    ticket: updateResult.rows[0],
  });
});

module.exports = { listRequests, reviewRequest, getDashboard, checkInTicket };
