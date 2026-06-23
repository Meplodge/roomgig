const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const facilities = [
  { name: 'Swimming Pool', icon: 'water-outline', description: 'Outdoor or indoor swimming pool' },
  { name: 'Gym', icon: 'fitness-outline', description: 'Fitness center with equipment' },
  { name: 'Parking', icon: 'car-outline', description: 'On-site parking available' },
  { name: 'Security', icon: 'shield-checkmark-outline', description: '24/7 security service' },
  { name: 'Garden', icon: 'leaf-outline', description: 'Private or shared garden' },
  { name: 'Elevator', icon: 'elevator-outline', description: 'Building elevator access' },
  { name: 'Concierge', icon: 'person-outline', description: 'Concierge service available' },
  { name: 'Rooftop Access', icon: 'sunny-outline', description: 'Rooftop terrace or garden' },
  { name: 'Home Theater', icon: 'film-outline', description: 'Private home theater room' },
  { name: 'WiFi', icon: 'wifi-outline', description: 'High-speed internet access' },
  { name: 'Air Conditioning', icon: 'snow-outline', description: 'Central air conditioning' },
  { name: 'Laundry', icon: 'shirt-outline', description: 'In-unit laundry facilities' },
  { name: 'Balcony', icon: 'flower-outline', description: 'Private balcony or terrace' },
  { name: 'Storage', icon: 'archive-outline', description: 'Additional storage space' },
  { name: 'Fireplace', icon: 'flame-outline', description: 'Fireplace in living area' }
];

async function runSeed() {
  try {
    console.log('Running seed...');
    console.log('Creating facilities...');
    
    for (const facility of facilities) {
      const { error } = await supabase
        .from('facilities')
        .upsert(facility, { onConflict: 'name' });
      
      if (error) {
        console.error(`Facility "${facility.name}" error:`, error);
      } else {
        console.log(`✓ Facility "${facility.name}" created`);
      }
    }
    
    console.log('\n✅ Seed completed successfully!');
    console.log(`\nCreated ${facilities.length} facilities`);
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

runSeed();
