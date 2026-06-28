const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sign } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;

const PUBLIC_USER_FIELDS = `
  user_id, full_name, email, role, city, latitude, longitude, preferences, created_at
`;

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, city, latitude, longitude } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, 'fullName, email, and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const allowedRoles = ['attendee', 'organizer'];
  const finalRole = allowedRoles.includes(role) ? role : 'attendee';
  // Note: 'admin' can never be self-assigned through signup.

  const existing = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, city, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${PUBLIC_USER_FIELDS}`,
    [fullName, email, passwordHash, finalRole, city || null, latitude || null, longitude || null]
  );

  const user = result.rows[0];
  const token = sign({ userId: user.user_id, role: user.role });

  res.status(201).json({ user, token });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = sign({ userId: user.user_id, role: user.role });
  delete user.password_hash;

  res.json({ user, token });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE user_id = $1`,
    [req.user.userId]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ user: result.rows[0] });
});

module.exports = { signup, login, getMe };
