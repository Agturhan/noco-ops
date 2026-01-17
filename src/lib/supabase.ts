// Supabase Client - Veritabanı bağlantısı
import { createClient } from '@supabase/supabase-js';

// Supabase credentials (from Dashboard > Settings > API)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client (for client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side - uses service role key for full access)
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : supabase;

export default supabase;
