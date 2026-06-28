-- EventSphere Database Schema (PostgreSQL)

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS suggestions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS event_requests CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========== USERS ==========
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(160) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'attendee'
                        CHECK (role IN ('attendee', 'organizer', 'admin')),
    city            VARCHAR(100),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    preferences     JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== EVENTS ==========
CREATE TABLE events (
    event_id         SERIAL PRIMARY KEY,
    organizer_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title            VARCHAR(160) NOT NULL,
    description      TEXT,
    category         VARCHAR(50) NOT NULL
                          CHECK (category IN ('concert','tech_workshop','food_festival','sports','bootcamp','other')),
    venue            VARCHAR(200) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    latitude         DECIMAL(9,6),
    longitude        DECIMAL(9,6),
    event_date       TIMESTAMPTZ NOT NULL,
    total_seats      INTEGER NOT NULL CHECK (total_seats >= 0),
    seats_available  INTEGER NOT NULL CHECK (seats_available >= 0),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);

-- ========== TICKET TYPES (price tiers per event) ==========
CREATE TABLE ticket_types (
    ticket_type_id   SERIAL PRIMARY KEY,
    event_id         INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    name             VARCHAR(30) NOT NULL CHECK (name IN ('VIP','Regular','Student')),
    price            DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity         INTEGER NOT NULL CHECK (quantity >= 0),
    quantity_sold    INTEGER NOT NULL DEFAULT 0,
    UNIQUE(event_id, name)
);

-- ========== EVENT REQUESTS (organizer submission -> admin approval) ==========
CREATE TABLE event_requests (
    request_id       SERIAL PRIMARY KEY,
    event_id         INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    submitted_by     INTEGER NOT NULL REFERENCES users(user_id),
    reviewed_by      INTEGER REFERENCES users(user_id),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
    review_notes     TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at      TIMESTAMPTZ
);

CREATE INDEX idx_requests_status ON event_requests(status);

-- ========== TICKETS (issued to attendees) ==========
CREATE TABLE tickets (
    ticket_id        SERIAL PRIMARY KEY,
    event_id         INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_type_id   INTEGER NOT NULL REFERENCES ticket_types(ticket_type_id),
    owner_id         INTEGER NOT NULL REFERENCES users(user_id),
    qr_hash          VARCHAR(64) UNIQUE NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'valid'
                          CHECK (status IN ('valid','used','cancelled','refunded')),
    checked_in_at    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_hash);

-- ========== PAYMENTS ==========
CREATE TABLE payments (
    payment_id        SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(user_id),
    ticket_id         INTEGER REFERENCES tickets(ticket_id),
    amount            DECIMAL(10,2) NOT NULL,
    currency          VARCHAR(10) NOT NULL DEFAULT 'USD',
    gateway           VARCHAR(20) NOT NULL CHECK (gateway IN ('stripe','jazzcash','easypaisa')),
    transaction_ref   VARCHAR(80) UNIQUE NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','success','failed','refunded')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== SUGGESTIONS (community feedback loop) ==========
CREATE TABLE suggestions (
    suggestion_id    SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(user_id),
    city             VARCHAR(100),
    category         VARCHAR(50),
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== MESSAGES (live chat per event) ==========
CREATE TABLE messages (
    message_id       SERIAL PRIMARY KEY,
    event_id         INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    sender_id        INTEGER NOT NULL REFERENCES users(user_id),
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_event ON messages(event_id);
