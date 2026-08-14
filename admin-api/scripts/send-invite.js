/**
 * Manually send an invite email + reset password for an existing auth user.
 * Used when the admin_users row was re-added but the auth user already existed
 * (so the normal invite flow was skipped).
 *
 *   node --env-file=.env scripts/send-invite.js <email> "<full name>" <role>
 */
require('dotenv').config();
const { randomBytes } = require('crypto');
const { supabase } = require('../src/supabase');

const [email, fullName, role] = process.argv.slice(2);
const fail = (m) => { console.error(`\n  ${m}\n`); process.exit(1); };

const run = async () => {
  if (!email) fail('Usage: node --env-file=.env scripts/send-invite.js <email> ["Full Name"] <role>');
  const normalized = email.trim().toLowerCase();
  const finalRole = role || 'analyst';
  const name = fullName || 'there';

  // Find the auth user
  let authUser = null;
  for (let page = 1; page <= 20 && !authUser; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`listUsers failed: ${error.message}`);
    authUser = (data.users || []).find((u) => (u.email || '').toLowerCase() === normalized);
    if (!data.users?.length || data.users.length < 200) break;
  }
  if (!authUser) fail(`No auth user found for ${normalized}`);
  console.log(`Found auth user: ${authUser.id}`);

  // Generate a new temp password and set it
  const tempPassword = `Rg-${randomBytes(12).toString('base64url')}`;
  const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: tempPassword,
  });
  if (updateError) fail(`Password reset failed: ${updateError.message}`);
  console.log('Password reset to temp password');

  // Send the invite email
  const emailApiUrl = (process.env.EMAIL_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const dashboardUrl = process.env.ADMIN_DASHBOARD_ORIGIN || 'http://localhost:5173';

  const html = `<p>Hi ${name},</p>
<p>You have been added as an <strong>${finalRole}</strong> on the RoomGig Admin Dashboard.</p>
<p>Sign in at <a href="${dashboardUrl}">${dashboardUrl}</a> with:</p>
<ul>
  <li><strong>Email:</strong> ${normalized}</li>
  <li><strong>Temporary password:</strong> <code>${tempPassword}</code></li>
</ul>
<p>Please change your password immediately after signing in (Settings → Change password).</p>
<p>— RoomGig</p>`;

  const text = `Hi ${name}, you have been added as an ${finalRole} on the RoomGig Admin Dashboard. Sign in at ${dashboardUrl} with email: ${normalized} and temporary password: ${tempPassword}. Please change your password immediately after signing in.`;

  const response = await fetch(`${emailApiUrl}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: normalized, subject: 'You are invited to the RoomGig Admin Dashboard', html, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    fail(`Email send failed (${response.status}): ${body}`);
  }

  const result = await response.json();
  console.log(`\nInvite email sent to ${normalized}!`);
  console.log(`  Message ID: ${result.messageId}`);
  console.log(`  Temp password: ${tempPassword}`);
  console.log('\n  ^ Share this with the admin if the email doesn\'t arrive.');
};

run().catch((e) => fail(e.message));
