const express = require('express');
const { bookTickets, getMyTickets } = require('../controllers/ticketsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/book', requireAuth, bookTickets);
router.get('/me', requireAuth, getMyTickets);

module.exports = router;
