const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const ticketsRoutes = require('./routes/ticketsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const suggestionsRoutes = require('./routes/suggestionsRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'eventsphere-api' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/suggestions', suggestionsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
