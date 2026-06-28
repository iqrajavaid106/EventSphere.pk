const express = require('express');
const { createSuggestion, listSuggestions } = require('../controllers/suggestionsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createSuggestion);
router.get('/', requireAuth, requireRole('admin', 'organizer'), listSuggestions);

module.exports = router;
