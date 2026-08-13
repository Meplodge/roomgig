/**
 * Bootstrap the first dashboard admin.
 *
 *   node --env-file=.env scripts/create-admin.js you@example.com "Your Name"
 *   npm run create-admin -- you@example.com "Your Name"
 *
 * Finds or creates the Supabase Auth user for that email, then inserts (or
 * upgrades) the matching admin_users row as super_admin. If the auth user has
 * to be created, a temporary password is printed once - change it immediately.
 */
require('dotenv').config();

const { randomBytes } = require('crypto');
const { supabase } = require('../src/supabase');

const [email, fullName] = process.argv.slice(2);

const fail = (message) => {
  console.error(`\n  ${message}\n`);
  process.exit(1);
};

const run = async () => {
  if (!email || !email.includes('@')) {
    fail('Usage: node --env-file=.env scripts/create-admin.js <email> ["Full Name"]');
  }
  const normalized = email.trim().toLowerCase();

  console.log(`Looking for an existing auth user for ${normalized}...`);
  let authUser = null;
  for (let page = 1; page <= 20 && !authUser; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Could not list users: ${error.message}`);
    authUser = (data.users || []).find((u) => (u.email || '').toLowerCase() === normalized) || null;
    if (!data.users?.length || data.users.length < 200) break;
  }

  let tempPassword = null;
  if (authUser) {
    console.log(`  found existing auth user ${authUser.id}`);
  } else {
    tempPassword = `Rg-${randomBytes(12).toString('base64url')}`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalized,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName || null },
    });
    if (error) fail(`Could not create auth user: ${error.message}`);
    authUser = data.user;
    console.log(`  created auth user ${authUser.id}`);
  }

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  let record;
  if (existing) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ role: 'super_admin', is_active: true, full_name: fullName || undefined })
      .eq('id', existing.id)
      .select('id, email, full_name, role, is_active')
      .single();
    if (error) fail(`Could not upgrade admin: ${error.message}`);
    record = data;
    console.log('  upgraded existing admin_users row to super_admin');
  } else {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: authUser.id,
        email: normalized,
        full_name: fullName || null,
        role: 'super_admin',
        is_active: true,
      })
      .select('id, email, full_name, role, is_active')
      .single();
    if (error) {
      if (error.message.includes('relation') && error.message.includes('admin_users')) {
        fail('admin_users does not exist yet. Apply supabase/migrations/026_admin_dashboard.sql first.');
      }
      fail(`Could not insert admin: ${error.message}`);
    }
    record = data;
    console.log('  inserted admin_users row');
  }

  console.log('\nDone. Sign in to the dashboard with:');
  console.log(`  email:    ${record.email}`);
  if (tempPassword) {
    console.log(`  password: ${tempPassword}`);
    console.log('\n  ^ temporary password, shown once. Change it after signing in.');
  } else {
    console.log('  password: (the existing password for this account)');
  }
  console.log(`  role:     ${record.role}\n`);
};

run().catch((error) => fail(error.message));
