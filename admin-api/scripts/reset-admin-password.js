/**
 * Reset the password of an existing Supabase Auth user.
 *
 *   npm run reset-admin-password -- you@example.com
 *
 * This is useful when the temporary password shown by create-admin was lost
 * because admin_users did not exist yet. It only touches auth.users, so it
 * can be run before or after the admin_users migration.
 */
require('dotenv').config();

const { randomBytes } = require('crypto');
const { supabase } = require('../src/supabase');

const [email] = process.argv.slice(2);

const fail = (message) => {
  console.error(`\n  ${message}\n`);
  process.exit(1);
};

const run = async () => {
  if (!email || !email.includes('@')) {
    fail('Usage: npm run reset-admin-password -- <email>');
  }
  const normalized = email.trim().toLowerCase();

  console.log(`Looking for auth user ${normalized}...`);
  let authUser = null;
  for (let page = 1; page <= 20 && !authUser; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Could not list users: ${error.message}`);
    authUser = (data.users || []).find((u) => (u.email || '').toLowerCase() === normalized) || null;
    if (!data.users?.length || data.users.length < 200) break;
  }

  if (!authUser) {
    fail(`No auth user found for ${normalized}. Did you mean to run create-admin instead?`);
  }

  const tempPassword = `Rg-${randomBytes(12).toString('base64url')}`;
  const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: tempPassword,
  });

  if (error) fail(`Could not reset password: ${error.message}`);

  console.log('\nDone. Use these credentials to sign in:');
  console.log(`  email:    ${normalized}`);
  console.log(`  password: ${tempPassword}`);
  console.log('\n  ^ temporary password, shown once. Change it after signing in.\n');
};

run().catch((error) => fail(error.message));
