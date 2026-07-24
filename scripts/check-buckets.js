const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await admin.storage.listBuckets();
  if (error) return console.error('listBuckets error:', error);
  console.log('=== Buckets ===');
  data.forEach((b) => console.log(`${b.name}  public=${b.public}`));
}

main();
