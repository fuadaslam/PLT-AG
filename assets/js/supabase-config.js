const _supabaseUrl = "https://yfbadvvlvtpuwfljrlpm.supabase.co";
const _supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmYmFkdnZsdnRwdXdmbGpybHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzY1OTMsImV4cCI6MjA5Njc1MjU5M30.Y7igrojvg8-iKoEYuggzThevdXCwOsqHic_n2rzni6M";

// Initialize Supabase Client
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(_supabaseUrl, _supabaseKey);
} else {
    console.error("Supabase CDN not loaded.");
    window.supabaseClient = undefined;
}
