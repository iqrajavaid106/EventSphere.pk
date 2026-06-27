-- ==========================================
-- 1. ROLES
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO roles (name) VALUES ('admin'), ('organizer'), ('attendee') ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. PROFILES (Tied to Supabase Auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role_id INTEGER REFERENCES roles(id) DEFAULT 3, -- defaults to attendee
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. EVENT_CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS event_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. EVENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES event_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255), -- Venue name or 'Online'
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    banner_url TEXT,
    capacity INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    ticket_tiers JSONB DEFAULT '[{"name": "Regular", "price": 50}, {"name": "VIP", "price": 150}, {"name": "Student", "price": 25}]'::jsonb,
    coupons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. TICKETS
-- ==========================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    ticket_type VARCHAR(50) DEFAULT 'General Admission', -- e.g., VIP, Early Bird
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    qr_code_data TEXT UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, cancelled, used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. PAYMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. ATTENDANCE_LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. CHATS
-- ==========================================
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE NOT NULL, -- One group chat per event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 9. MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. FEEDBACK
-- ==========================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (event_id, profile_id) -- Ensures a user reviews an event only once
);

-- ==========================================
-- 11. BUSINESS_REQUESTS (For user -> organizer upgrades)
-- ==========================================
CREATE TABLE IF NOT EXISTS business_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    tax_id_or_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 12. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    type VARCHAR(50), -- e.g., 'ticket', 'event_update', 'chat'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. ROLES POLICIES (Read-only for all authenticated users)
-- ============================================================================
CREATE POLICY "Allow public read access to roles" ON roles
    FOR SELECT TO authenticated, anon USING (true);

-- ============================================================================
-- 2. PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Allow public read access to profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. EVENT_CATEGORIES POLICIES
-- ============================================================================
CREATE POLICY "Allow public read access to categories" ON event_categories
    FOR SELECT USING (true);

-- ============================================================================
-- 4. EVENTS POLICIES
-- ============================================================================
CREATE POLICY "Allow public read access to published events" ON events
    FOR SELECT USING (is_published = true);

CREATE POLICY "Allow organizers to read their own unpublished events" ON events
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Allow organizers to insert events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() = organizer_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id IN (1, 2)) -- admin or organizer
    );

CREATE POLICY "Allow organizers to update their own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Allow organizers to delete their own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- ============================================================================
-- 5. TICKETS POLICIES
-- ============================================================================
CREATE POLICY "Allow users to view their own tickets" ON tickets
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Allow organizers to view tickets for their events" ON tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM events WHERE events.id = tickets.event_id AND events.organizer_id = auth.uid())
    );

CREATE POLICY "Allow users to book tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- 6. PAYMENTS POLICIES
-- ============================================================================
CREATE POLICY "Allow users to view their own payments" ON payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM tickets WHERE tickets.id = payments.ticket_id AND tickets.profile_id = auth.uid())
    );

-- ============================================================================
-- 7. ATTENDANCE_LOGS POLICIES
-- ============================================================================
CREATE POLICY "Allow organizers to view logs for their events" ON attendance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            JOIN events ON tickets.event_id = events.id 
            WHERE tickets.id = attendance_logs.ticket_id AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Allow organizers/scanners to log attendance" ON attendance_logs
    FOR INSERT WITH CHECK (auth.uid() = scanned_by);

-- ============================================================================
-- 8. CHATS POLICIES
-- ============================================================================
CREATE POLICY "Allow event ticket holders or organizers to see the chat" ON chats
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM tickets WHERE tickets.event_id = chats.event_id AND tickets.profile_id = auth.uid() AND tickets.status = 'active') OR
        EXISTS (SELECT 1 FROM events WHERE events.id = chats.event_id AND events.organizer_id = auth.uid())
    );

-- ============================================================================
-- 9. MESSAGES POLICIES
-- ============================================================================
CREATE POLICY "Allow members to read messages" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id)
    );

CREATE POLICY "Allow members to send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- 10. FEEDBACK POLICIES
-- ============================================================================
CREATE POLICY "Allow anyone to read event feedback" ON feedback
    FOR SELECT USING (true);

CREATE POLICY "Allow ticket holders to leave feedback" ON feedback
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id AND
        EXISTS (SELECT 1 FROM tickets WHERE tickets.event_id = feedback.event_id AND tickets.profile_id = auth.uid() AND tickets.status = 'used')
    );

-- ============================================================================
-- 11. BUSINESS_REQUESTS POLICIES
-- ============================================================================
CREATE POLICY "Allow users to view their own upgrade requests" ON business_requests
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Allow users to submit an upgrade request" ON business_requests
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ============================================================================
-- 12. NOTIFICATIONS POLICIES
-- ============================================================================
CREATE POLICY "Allow users to view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Allow users to update their own notification status" ON notifications
    FOR UPDATE USING (auth.uid() = profile_id);