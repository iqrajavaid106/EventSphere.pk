const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/suggestions  body: { content, city, category }
const createSuggestion = asyncHandler(async (req, res) => {
  const { content, city, category } = req.body;
  if (!content || content.trim().length < 5) {
    throw new ApiError(400, 'content must be at least 5 characters');
  }

  const result = await db.query(
    `INSERT INTO suggestions (user_id, city, category, content)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.userId, city || null, category || null, content.trim()]
  );
  res.status(201).json({ suggestion: result.rows[0] });
});

// GET /api/suggestions  (admin/organizer: view aggregated demand signals)
const listSuggestions = asyncHandler(async (req, res) => {
  const { city, category } = req.query;
  const conditions = [];
  const params = [];

  if (city) {
    params.push(city);
    conditions.push(`city ILIKE $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT s.suggestion_id, s.content, s.city, s.category, s.created_at, u.full_name AS submitted_by
     FROM suggestions s JOIN users u ON u.user_id = s.user_id
     ${where}
     ORDER BY s.created_at DESC LIMIT 200`,
    params
  );
  res.json({ suggestions: result.rows });
});

module.exports = { createSuggestion, listSuggestions };
