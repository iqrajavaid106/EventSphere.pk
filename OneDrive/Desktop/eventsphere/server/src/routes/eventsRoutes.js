const express = require('express');
const { listEvents, getEvent, createEvent, cancelEvent } = require('../controllers/eventsController');
const { getEventMessages } = require('../controllers/chatController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public browsing — optional auth (lets admins/organizers see more statuses)
router.get('/', optionalAuth, listEvents);
router.get('/:id', getEvent);
router.get('/:id/messages', getEventMessages);

router.post('/', requireAuth, requireRole('organizer', 'admin'), createEvent);
router.patch('/:id/cancel', requireAuth, requireRole('organizer', 'admin'), cancelEvent);

module.exports = router;
