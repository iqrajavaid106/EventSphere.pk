/**
 * Seed script. Run with: npm run db:seed
 * Creates an admin, an organizer, an attendee, and two sample events.
 * All seeded users share the password defined in SEED_USER_PASSWORD (.env).
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  const plainPassword = process.env.SEED_USER_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  console.log('Seeding users...');
  const usersResult = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, city, latitude, longitude, preferences)
     VALUES
       ('Admin User', 'admin@eventsphere.io', $1, 'admin', 'Lahore', 31.5497, 74.3436, '[]'),
       ('Sara Organizer', 'sara@eventsphere.io', $1, 'organizer', 'Lahore', 31.5204, 74.3587, '["tech"]'),
       ('Ali Attendee', 'ali@eventsphere.io', $1, 'attendee', 'Lahore', 31.5825, 74.3293, '["music","tech"]')
     RETURNING user_id, email, role`,
    [passwordHash]
  );
  console.table(usersResult.rows);

  const organizerId = usersResult.rows.find((u) => u.role === 'organizer').user_id;

  console.log('Seeding events...');
  const eventsResult = await db.query(
    `INSERT INTO events (organizer_id, title, description, category, venue, city, latitude, longitude, event_date, total_seats, seats_available, status)
     VALUES
       ($1, 'Lahore Tech Summit 2026', 'A full-day summit on AI, cloud, and startups.', 'tech_workshop', 'Expo Center', 'Lahore', 31.4697, 74.2728, '2026-08-15 10:00:00+05', 300, 300, 'approved'),
       ($1, 'Indie Music Night', 'Local bands performing live.', 'concert', 'Alhamra Arts Council', 'Lahore', 31.5656, 74.3142, '2026-07-10 19:00:00+05', 150, 150, 'pending')
     RETURNING event_id, title, status`,
    [organizerId]
  );
  console.table(eventsResult.rows);

  const [techEvent, musicEvent] = eventsResult.rows;

  console.log('Seeding ticket types...');
  await db.query(
    `INSERT INTO ticket_types (event_id, name, price, quantity) VALUES
       ($1, 'VIP', 50.00, 30),
       ($1, 'Regular', 20.00, 200),
       ($1, 'Student', 10.00, 70),
       ($2, 'Regular', 15.00, 150)`,
    [techEvent.event_id, musicEvent.event_id]
  );

  console.log('\nSeed complete. All users\' password is:', plainPassword);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
