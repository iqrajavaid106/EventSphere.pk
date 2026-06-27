-- Run this script in your Supabase Dashboard SQL Editor to fix Row Level Security (RLS) policies and upgrade the admin account.

-- 1. Upgrade iqranaeemjavaid4@gmail.com to Admin (role_id = 1) in the profiles table
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'iqranaeemjavaid4@gmail.com';
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles SET role_id = 1 WHERE id = target_user_id;
        RAISE NOTICE 'Upgraded iqranaeemjavaid4@gmail.com to Admin role.';
    ELSE
        RAISE WARNING 'User iqranaeemjavaid4@gmail.com not found in auth.users. Please register the user via the UI first, then re-run this script.';
    END IF;
END $$;

-- 2. Fix business_requests SELECT policy (Allow admins to see all pitches)
DROP POLICY IF EXISTS "Allow users to view their own upgrade requests" ON public.business_requests;
DROP POLICY IF EXISTS "Allow users and admins to view upgrade requests" ON public.business_requests;
CREATE POLICY "Allow users and admins to view upgrade requests" ON public.business_requests
    FOR SELECT USING (
        auth.uid() = profile_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 3. Add business_requests UPDATE policy (Allow admins to approve/reject pitches)
DROP POLICY IF EXISTS "Allow admins to update upgrade requests" ON public.business_requests;
CREATE POLICY "Allow admins to update upgrade requests" ON public.business_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 3.1. Add business_requests INSERT policy (Allow authenticated users to submit upgrade requests)
DROP POLICY IF EXISTS "Allow users to submit an upgrade request" ON public.business_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert upgrade requests" ON public.business_requests;
CREATE POLICY "Allow authenticated users to insert upgrade requests" ON public.business_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- 4. Fix profiles UPDATE policy (Allow admins to upgrade users to Organizer status)
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;
CREATE POLICY "Allow admins to update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 5. Fix events UPDATE policy (Allow admins to approve/publish events)
DROP POLICY IF EXISTS "Allow organizers to update their own events" ON public.events;
DROP POLICY IF EXISTS "Allow organizers and admins to update events" ON public.events;
CREATE POLICY "Allow organizers and admins to update events" ON public.events
    FOR UPDATE USING (
        auth.uid() = organizer_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 6. Fix tickets SELECT policy (Allow admins to see all issued tickets across the platform)
DROP POLICY IF EXISTS "Allow users to view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow users and admins to view tickets" ON public.tickets;
CREATE POLICY "Allow users and admins to view tickets" ON public.tickets
    FOR SELECT USING (
        auth.uid() = profile_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1) OR
        EXISTS (SELECT 1 FROM public.events WHERE events.id = tickets.event_id AND events.organizer_id = auth.uid())
    );

-- 7. Fix events INSERT policy (Allow admins to insert events for any organizer)
DROP POLICY IF EXISTS "Allow organizers to insert events" ON public.events;
DROP POLICY IF EXISTS "Allow organizers and admins to insert events" ON public.events;
CREATE POLICY "Allow organizers and admins to insert events" ON public.events
    FOR INSERT WITH CHECK (
        (auth.uid() = organizer_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN (1, 2))) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 8. Fix events DELETE policy (Allow admins to delete any event)
DROP POLICY IF EXISTS "Allow organizers to delete their own events" ON public.events;
DROP POLICY IF EXISTS "Allow organizers and admins to delete events" ON public.events;
CREATE POLICY "Allow organizers and admins to delete events" ON public.events
    FOR DELETE USING (
        auth.uid() = organizer_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 1)
    );

-- 9. Fix chats SELECT and INSERT policies (Allow all authenticated users to read and create chat rooms)
DROP POLICY IF EXISTS "Allow event ticket holders or organizers to see the chat" ON public.chats;
DROP POLICY IF EXISTS "Allow authenticated users to select chats" ON public.chats;
CREATE POLICY "Allow authenticated users to select chats" ON public.chats
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert chats" ON public.chats;
CREATE POLICY "Allow authenticated users to insert chats" ON public.chats
    FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Fix messages SELECT and INSERT policies (Allow all authenticated users to read and send messages)
DROP POLICY IF EXISTS "Allow members to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to select messages" ON public.messages;
CREATE POLICY "Allow authenticated users to select messages" ON public.messages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow members to send messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON public.messages;
CREATE POLICY "Allow authenticated users to insert messages" ON public.messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 11. Populate default event categories
INSERT INTO public.event_categories (name, slug, description)
VALUES 
    ('Technology', 'technology', 'Developer meetups, hackathons, and tech conferences'),
    ('Music', 'music', 'Concerts, music festivals, and live performances'),
    ('Finance', 'finance', 'Investing seminars, crypto discussions, and financial planning talks')
ON CONFLICT (name) DO NOTHING;
