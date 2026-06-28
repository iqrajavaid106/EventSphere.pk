const express = require('express');
const {
  listRequests,
  reviewRequest,
  getDashboard,
  checkInTicket,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/requests', listRequests);
router.patch('/requests/:id', reviewRequest);
router.get('/dashboard', getDashboard);
router.post('/check-in', checkInTicket);

module.exports = router;
