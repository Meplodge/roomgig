const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase Auth is email-based, so the "test" username is mapped to an email.
const username = 'test';
const email = 'roomgig.tester2026@gmail.com';
const password = 'test123';

async function addUser() {
  console.log(`Creating user "${username}" (${email})...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: username,
        avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      },
    },
  });

  if (error) {
    console.error('Failed to create user:', error.message);
    process.exit(1);
  }

  console.log('\n✅ User created successfully!');
  console.log('User ID:', data.user?.id);
  console.log('Email:', data.user?.email);
  console.log('Username (full_name):', username);
  console.log('Password:', password);

  if (data.user && !data.user.confirmed_at && !data.session) {
    console.log(
      '\n⚠️  Email confirmation may be required before this user can log in.'
    );
    console.log(
      '   Disable "Confirm email" in Supabase Auth settings, or confirm the user in the dashboard.'
    );
  }
}

addUser();
