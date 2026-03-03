// ==============================
// SUPABASE INITIALIZATION
// ==============================

const SUPABASE_URL = "https://kxenpfaldfgfzkfofqil.supabase.co";  // your project URL
const SUPABASE_ANON_KEY = "sb_publishable_tCyVWF1LD5j5E306GxyLyg_DsbYYECi"; // paste anon public key here

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);