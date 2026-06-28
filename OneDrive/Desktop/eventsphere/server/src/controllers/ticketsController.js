const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

function generateQrHash(eventId, ticketTypeId, userId) {
  const raw = `${eventId}-${ticketTypeId}-${userId}-${uuidv4()}-${Date.now()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Simulates calling an external gateway (Stripe / JazzCash / EasyPaisa).
 * Succeeds with probability PAYMENT_SUCCESS_RATE from env (default 0.95).
 */
function simulateGatewayCharge() {
  const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE || '0.95');
  const success = Math.random() < successRate;
  return {
    success,
    transactionRef: `MOCK-${uuidv4()}`,
  };
}

// POST /api/tickets/book
// body: { eventId, ticketTypeId, quantity, gateway }
const bookTickets = asyncHandler(async (req, res) => {
  const { eventId, ticketTypeId, quantity, gateway } = req.body;
  const qty = parseInt(quantity, 10) || 1;

  if (!eventId || !ticketTypeId) {
    throw new ApiError(400, 'eventId and ticketTypeId are required');
  }
  if (qty < 1 || qty > 10) {
    throw new ApiError(400, 'quantity must be between 1 and 10');
  }
  if (!['stripe', 'jazzcash', 'easypaisa'].includes(gateway)) {
    throw new ApiError(400, 'gateway must be one of: stripe, jazzcash, easypaisa');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock the ticket type row to prevent overselling under concurrent requests.
    const ttResult = await client.query(
      `SELECT * FROM ticket_types WHERE ticket_type_id = $1 AND event_id = $2 FOR UPDATE`,
      [ticketTypeId, eventId]
    );
    if (ttResult.rows.length === 0) {
      throw new ApiError(404, 'Ticket type not found for this event');
    }
    const ticketType = ttResult.rows[0];

    const eventResult = await client.query(`SELECT * FROM events WHERE event_id = $1`, [eventId]);
    const event = eventResult.rows[0];
    if (!event || event.status !== 'approved') {
      throw new ApiError(400, 'This event is not open for booking');
    }

    const remaining = ticketType.quantity - ticketType.quantity_sold;
    if (remaining < qty) {
      throw new ApiError(409, `Only ${remaining} ${ticketType.name} ticket(s) remaining`);
    }

    const totalAmount = (parseFloat(ticketType.price) * qty).toFixed(2);

    // Simulate the payment gateway call.
    const charge = simulateGatewayCharge();

    const paymentResult = await client.query(
      `INSERT INTO payments (user_id, amount, currency, gateway, transaction_ref, status)
       VALUES ($1,$2,'USD',$3,$4,$5) RETURNING *`,
      [req.user.userId, totalAmount, gateway, charge.transactionRef, charge.success ? 'success' : 'failed']
    );
    const payment = paymentResult.rows[0];

    if (!charge.success) {
      await client.query('COMMIT'); // keep the failed payment record, but issue no tickets
      throw new ApiError(402, 'Payment failed. Please try again or use a different payment method.');
    }

    // Issue tickets
    const tickets = [];
    for (let i = 0; i < qty; i += 1) {
      const qrHash = generateQrHash(eventId, ticketTypeId, req.user.userId);
      const ticketResult = await client.query(
        `INSERT INTO tickets (event_id, ticket_type_id, owner_id, qr_hash, status)
         VALUES ($1,$2,$3,$4,'valid') RETURNING *`,
        [eventId, ticketTypeId, req.user.userId, qrHash]
      );
      tickets.push(ticketResult.rows[0]);
    }

    // Link payment to the first ticket for traceability (simple 1-payment-per-booking model)
    await client.query(`UPDATE payments SET ticket_id = $1 WHERE payment_id = $2`, [
      tickets[0].ticket_id,
      payment.payment_id,
    ]);

    await client.query(
      `UPDATE ticket_types SET quantity_sold = quantity_sold + $1 WHERE ticket_type_id = $2`,
      [qty, ticketTypeId]
    );
    await client.query(
      `UPDATE events SET seats_available = seats_available - $1 WHERE event_id = $2`,
      [qty, eventId]
    );

    await client.query('COMMIT');
    res.status(201).json({ payment, tickets });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/tickets/me
const getMyTickets = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT t.ticket_id, t.qr_hash, t.status, t.checked_in_at, t.created_at,
            tt.name AS ticket_type, tt.price,
            e.event_id, e.title, e.venue, e.city, e.event_date
     FROM tickets t
     JOIN ticket_types tt ON tt.ticket_type_id = t.ticket_type_id
     JOIN events e ON e.event_id = t.event_id
     WHERE t.owner_id = $1
     ORDER BY e.event_date ASC`,
    [req.user.userId]
  );
  res.json({ tickets: result.rows });
});

module.exports = { bookTickets, getMyTickets };
