// SHIVANSH INTERIORS — Admin CMS Supabase configuration
//
// Both values below are safe to have in client-side code by design — the
// real security boundary is the Row Level Security policies (already run
// in the SQL Editor), not secrecy of this key.
const SUPABASE_URL = 'https://ebpybqxmmqmpciyaqxpu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicHlicXhtbXFtcGNpeWFxeHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzI2MDAsImV4cCI6MjEwMTY0ODYwMH0.sEBYY5hiMM88R3Pqdax7_qgBcw5Apr3xSywqXRhmWk4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
