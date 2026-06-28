const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Haversine distance in km between two lat/lng points
const DISTANCE_SQL = `
  (
    6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians($lat)) * cos(radians(e.latitude)) *
        cos(radians(e.longitude) - radians($lng)) +
        sin(radians($lat)) * sin(radians(e.latitude))
      ))
    )
  )
`;

// GET /api/events
// Query params: city, category, lat, lng, radiusKm, status (admin/organizer only), search
const listEvents = asyncHandler(async (req, res) => {
  const { city, category, lat, lng, radiusKm, search } = req.query;

  const conditions = [];
  const params = [];
  let distanceSelect = '';
  let orderBy = 'e.event_date ASC';

  // Non-admin/organizer requests only ever see approved, upcoming events.
  const isPrivileged = req.user && ['admin', 'organizer'].includes(req.user.role);
  if (isPrivileged && req.query.status) {
    params.push(req.query.status);
    conditions.push(`e.status = $${params.length}`);
  } else {
    conditions.push(`e.status = 'approved'`);
  }

  if (city) {
    params.push(city);
    conditions.push(`e.city ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`e.category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`);
  }

  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    distanceSelect = DISTANCE_SQL.replace(/\$lat/g, latNum).replace(/\$lng/g, lngNum);
    orderBy = 'distance_km ASC NULLS LAST, e.event_date ASC';
    if (radiusKm) {
      conditions.push(`e.latitude IS NOT NULL AND e.longitude IS NOT NULL AND ${distanceSelect} <= ${parseFloat(radiusKm)}`);
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const distanceColumn = distanceSelect ? `, ${distanceSelect} AS distance_km` : '';

  const sql = `
    SELECT
      e.event_id, e.title, e.description, e.category, e.venue, e.city,
      e.latitude, e.longitude, e.event_date, e.total_seats, e.seats_available,
      e.status, e.created_at,
      u.full_name AS organizer_name
      ${distanceColumn}
    FROM events e
    JOIN users u ON u.user_id = e.organizer_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 100
  `;

  const result = await db.query(sql, params);
  res.json({ events: result.rows });
});

// GET /api/events/:id
const getEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const eventResult = await db.query(
    `SELECT e.*, u.full_name AS organizer_name
     FROM events e JOIN users u ON u.user_id = e.organizer_id
     WHERE e.event_id = $1`,
    [id]
  );
  if (eventResult.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }

  const ticketTypesResult = await db.query(
    `SELECT ticket_type_id, name, price, quantity, quantity_sold
     FROM ticket_types WHERE event_id = $1 ORDER BY price DESC`,
    [id]
  );

  res.json({ event: eventResult.rows[0], ticketTypes: ticketTypesResult.rows });
});

// POST /api/events
// Organizers submit an event; it is created with status='pending' and
// a matching event_requests row, awaiting admin approval.
const createEvent = asyncHandler(async (req, res) => {
  const {
    title, description, category, venue, city,
    latitude, longitude, eventDate, totalSeats, ticketTypes,
  } = req.body;

  if (!title || !category || !venue || !city || !eventDate || !totalSeats) {
    throw new ApiError(400, 'title, category, venue, city, eventDate, and totalSeats are required');
  }
  if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
    throw new ApiError(400, 'At least one ticket type is required');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      `INSERT INTO events
         (organizer_id, title, description, category, venue, city, latitude, longitude, event_date, total_seats, seats_available, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,'pending')
       RETURNING *`,
      [req.user.userId, title, description || null, category, venue, city, latitude || null, longitude || null, eventDate, totalSeats]
    );
    const event = eventResult.rows[0];

    for (const t of ticketTypes) {
      if (!['VIP', 'Regular', 'Student'].includes(t.name)) {
        throw new ApiError(400, `Invalid ticket type name: ${t.name}`);
      }
      await client.query(
        `INSERT INTO ticket_types (event_id, name, price, quantity) VALUES ($1,$2,$3,$4)`,
        [event.event_id, t.name, t.price, t.quantity]
      );
    }

    await client.query(
      `INSERT INTO event_requests (event_id, submitted_by, status) VALUES ($1,$2,'pending')`,
      [event.event_id, req.user.userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ event });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/events/:id/cancel  (organizer who owns it, or admin)
const cancelEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const eventResult = await db.query('SELECT organizer_id FROM events WHERE event_id = $1', [id]);
  if (eventResult.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }
  const event = eventResult.rows[0];
  if (req.user.role !== 'admin' && event.organizer_id !== req.user.userId) {
    throw new ApiError(403, 'You can only cancel your own events');
  }

  const result = await db.query(
    `UPDATE events SET status = 'cancelled', updated_at = now() WHERE event_id = $1 RETURNING *`,
    [id]
  );
  res.json({ event: result.rows[0] });
});

module.exports = { listEvents, getEvent, createEvent, cancelEvent };
