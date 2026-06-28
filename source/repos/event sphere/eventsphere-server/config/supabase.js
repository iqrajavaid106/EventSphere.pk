const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌  Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

// Regular client — respects Row Level Security
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — bypasses Row Level Security (server-side only)
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase;

module.exports = { supabase, supabaseAdmin };