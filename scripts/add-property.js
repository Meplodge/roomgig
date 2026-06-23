const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env for admin access, or ensure EXPO_PUBLIC_SUPABASE_ANON_KEY is set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
const args = process.argv.slice(2);

function showUsage() {
  console.log('Usage: node scripts/add-property.js [options]');
  console.log('\nRequired options:');
  console.log('  --host-id <uuid>           Host user ID');
  console.log('  --title <string>           Property title');
  console.log('  --type <rent|sale|buy>    Property type');
  console.log('  --category <apartment|villa|house|duplex|studio|condo|townhouse>');
  console.log('  --price <number>           Property price');
  console.log('\nOptional options:');
  console.log('  --description <string>    Property description');
  console.log('  --address <string>         Street address');
  console.log('  --city <string>           City');
  console.log('  --state <string>          State/Province');
  console.log('  --country <string>        Country (default: USA)');
  console.log('  --postal-code <string>    Postal/ZIP code');
  console.log('  --bedrooms <number>       Number of bedrooms');
  console.log('  --bathrooms <number>      Number of bathrooms');
  console.log('  --square-feet <number>    Square footage');
  console.log('  --year-built <number>     Year built');
  console.log('  --host-name <string>      Host name');
  console.log('  --host-phone <string>     Host phone');
  console.log('  --host-email <string>     Host email');
  console.log('  --status <active|pending|sold|rented|inactive|deleted>');
  console.log('  --image-url <string>      Primary image URL');
  console.log('\nExample:');
  console.log('  node scripts/add-property.js \\');
  console.log('    --host-id "123e4567-e89b-12d3-a456-426614174000" \\');
  console.log('    --title "Modern Downtown Apartment" \\');
  console.log('    --type "rent" \\');
  console.log('    --category "apartment" \\');
  console.log('    --price 2500 \\');
  console.log('    --city "New York" \\');
  console.log('    --bedrooms 2 \\');
  console.log('    --bathrooms 2');
}

function parseArgs() {
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const value = args[i + 1];
      if (value && !value.startsWith('--')) {
        parsed[key] = value;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  
  return parsed;
}

function validateRequiredFields(parsed) {
  const required = ['hostId', 'title', 'type', 'category', 'price'];
  const missing = required.filter(field => !parsed[field]);
  
  if (missing.length > 0) {
    console.error('Missing required fields:', missing.join(', '));
    return false;
  }
  
  // Validate enum values
  const validTypes = ['rent', 'sale', 'buy'];
  if (!validTypes.includes(parsed.type)) {
    console.error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    return false;
  }
  
  const validCategories = ['apartment', 'villa', 'house', 'duplex', 'studio', 'condo', 'townhouse'];
  if (!validCategories.includes(parsed.category)) {
    console.error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    return false;
  }
  
  if (parsed.status) {
    const validStatuses = ['active', 'pending', 'sold', 'rented', 'inactive', 'deleted'];
    if (!validStatuses.includes(parsed.status)) {
      console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      return false;
    }
  }
  
  return true;
}

async function addProperty(parsed) {
  try {
    console.log('Adding property to database...');
    
    const propertyData = {
      host_id: parsed.hostId,
      title: parsed.title,
      description: parsed.description || null,
      type: parsed.type,
      category: parsed.category,
      status: parsed.status || 'active',
      address: parsed.address || null,
      city: parsed.city || null,
      state: parsed.state || null,
      country: parsed.country || 'USA',
      postal_code: parsed.postalCode || null,
      price: parseFloat(parsed.price),
      bedrooms: parsed.bedrooms ? parseInt(parsed.bedrooms) : null,
      bathrooms: parsed.bathrooms ? parseFloat(parsed.bathrooms) : null,
      square_feet: parsed.squareFeet ? parseInt(parsed.squareFeet) : null,
      year_built: parsed.yearBuilt ? parseInt(parsed.yearBuilt) : null,
      host_name: parsed.hostName || null,
      host_phone: parsed.hostPhone || null,
      host_email: parsed.hostEmail || null,
    };
    
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding property:', error);
      process.exit(1);
    }
    
    console.log('✅ Property added successfully!');
    console.log('\nProperty Details:');
    console.log(`  ID: ${data.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Type: ${data.type}`);
    console.log(`  Category: ${data.category}`);
    console.log(`  Price: $${data.price}`);
    console.log(`  City: ${data.city || 'N/A'}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Created at: ${data.created_at}`);
    
    // Add image if provided
    if (parsed.imageUrl) {
      const { error: imageError } = await supabase
        .from('property_images')
        .insert({
          property_id: data.id,
          image_url: parsed.imageUrl,
          is_primary: true,
          display_order: 0
        });
      
      if (imageError) {
        console.error('Warning: Could not add image:', imageError);
      } else {
        console.log(`  Image: ${parsed.imageUrl}`);
      }
    }
    
  } catch (error) {
    console.error('Failed to add property:', error);
    process.exit(1);
  }
}

async function main() {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  const parsed = parseArgs();
  
  if (!validateRequiredFields(parsed)) {
    showUsage();
    process.exit(1);
  }
  
  await addProperty(parsed);
}

main();
