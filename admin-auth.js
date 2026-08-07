// SHIVANSH INTERIORS — Admin CMS route guard
//
// Include this on every protected admin page AFTER supabase-config.js.
// This is the client-side UX layer ("bounce visitors who aren't logged in
// back to the login screen"). The REAL security boundary is the RLS
// policies in schema.sql — this script can't be bypassed to read/write
// data, only to skip the redirect, and skipping the redirect gets you a
// blank dashboard with no data (every query still gets blocked by RLS).
//
// Usage:
//   requireAdmin().then(profile => { /* profile.full_name, profile.role */ });

async function requireAdmin() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = '/admin-login.html';
    return null;
  }

  const { data: profile, error } = await supabaseClient
    .from('admin_profiles')
    .select('id, full_name, role')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    // Logged in, but not an authorized admin (no admin_profiles row yet).
    await supabaseClient.auth.signOut();
    window.location.href = '/admin-login.html?unauthorized=1';
    return null;
  }

  return profile;
}

async function signOutAdmin() {
  await supabaseClient.auth.signOut();
  window.location.href = '/admin-login.html';
}
