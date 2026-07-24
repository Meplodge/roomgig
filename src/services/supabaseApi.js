import { supabase } from '../utils/supabase';
import { File } from 'expo-file-system';

// Read a local image file into a Uint8Array for upload.
// On Android, fetch('file://...').arrayBuffer() intermittently throws
// "Network request failed"; reading bytes natively via expo-file-system
// avoids the network layer entirely and is reliable.
const readImageBytes = async (imageUri) => {
  return await new File(imageUri).bytes();
};

// Test database connection
export const testConnection = async () => {
  console.log('=== Testing Database Connection ===');
  
  // Test 1: Simple count query
  const { count, error: countError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total properties count:', count);
  if (countError) {
    console.error('Count query error:', countError);
  }
  
  // Test 2: Active properties count
  const { count: activeCount, error: activeError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  console.log('Active properties count:', activeCount);
  if (activeError) {
    console.error('Active count error:', activeError);
  }
  
  // Test 3: Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  console.log('User authenticated:', !!session);
  console.log('User ID:', session?.user?.id);
  
  return { count, activeCount, authenticated: !!session };
};

// Properties API
export const getProperties = async (filters = {}) => {
  console.log('Fetching properties with filters:', filters);
  
  // First, check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  console.log('User authenticated:', !!session);
  console.log('User ID:', session?.user?.id);
  
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_images(image_url, is_primary),
      property_facilities(facilities(name, icon))
    `)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.bedrooms) {
    query = query.gte('bedrooms', filters.bedrooms);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  const { data, error } = await query.order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('Properties fetched:', data?.length || 0);
  console.log('Raw data sample:', data?.[0] ? JSON.stringify(data[0], null, 2).substring(0, 200) : 'No data');

  // Get ratings for all properties
  const propertyIds = data.map(p => p.id);
  const { data: ratingsData } = await supabase
    .from('reviews')
    .select('property_id, rating')
    .in('property_id', propertyIds)
    .eq('is_visible', true);

  // Calculate average rating per property
  const ratingsMap = {};
  ratingsData?.forEach(review => {
    if (!ratingsMap[review.property_id]) {
      ratingsMap[review.property_id] = { sum: 0, count: 0 };
    }
    ratingsMap[review.property_id].sum += review.rating;
    ratingsMap[review.property_id].count += 1;
  });

  // Transform data to match component expectations
  return data.map(property => {
    const rating = ratingsMap[property.id];
    const averageRating = rating ? Math.round((rating.sum / rating.count) * 10) / 10 : 0;
    const reviewCount = rating ? rating.count : 0;
    
    return {
      ...property,
      name: property.title,
      beds: property.bedrooms,
      baths: property.bathrooms,
      sqft: property.square_feet,
      location: property.city,
      images: property.property_images?.map(img => img.image_url) || [],
      image: property.property_images?.[0]?.image_url,
      facilities: property.property_facilities?.map(pf => pf.facilities?.name).filter(Boolean) || [],
      rating: averageRating,
      reviews: reviewCount,
    };
  });
};

export const getPropertyById = async (propertyId) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_images(image_url, is_primary),
      property_facilities(facilities(name, icon)),
      profiles(host_name, host_phone, host_email, avatar_url)
    `)
    .eq('id', propertyId)
    .single();

  if (error) throw error;

  // Get rating for this property
  const { data: ratingsData } = await supabase
    .from('reviews')
    .select('rating')
    .eq('property_id', propertyId)
    .eq('is_visible', true);

  let averageRating = 0;
  let reviewCount = 0;
  if (ratingsData && ratingsData.length > 0) {
    const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Math.round((sum / ratingsData.length) * 10) / 10;
    reviewCount = ratingsData.length;
  }

  return {
    ...data,
    name: data.title,
    beds: data.bedrooms,
    baths: data.bathrooms,
    sqft: data.square_feet,
    location: data.city,
    images: data.property_images?.map(img => img.image_url) || [],
    image: data.property_images?.[0]?.image_url,
    facilities: data.property_facilities?.map(pf => pf.facilities?.name).filter(Boolean) || [],
    rating: averageRating,
    reviews: reviewCount,
  };
};

export const getUserProperties = async (userId) => {
  console.log('Fetching properties for user:', userId);
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_images(image_url, is_primary),
      property_facilities(facilities(name, icon))
    `)
    .eq('host_id', userId)
    .is('deleted_at', null);

  const { data, error } = await query.order('listed_at', { ascending: false });

  if (error) {
    console.error('Error fetching user properties:', error);
    throw error;
  }

  console.log('User properties fetched:', data?.length || 0);

  // Get ratings for all properties
  const propertyIds = data.map(p => p.id);
  const { data: ratingsData } = await supabase
    .from('reviews')
    .select('property_id, rating')
    .in('property_id', propertyIds)
    .eq('is_visible', true);

  // Calculate average rating per property
  const ratingsMap = {};
  ratingsData?.forEach(review => {
    if (!ratingsMap[review.property_id]) {
      ratingsMap[review.property_id] = { sum: 0, count: 0 };
    }
    ratingsMap[review.property_id].sum += review.rating;
    ratingsMap[review.property_id].count += 1;
  });

  // Transform data to match component expectations
  return data.map(property => {
    const rating = ratingsMap[property.id];
    const averageRating = rating ? Math.round((rating.sum / rating.count) * 10) / 10 : 0;
    const reviewCount = rating ? rating.count : 0;
    
    return {
      ...property,
      name: property.title,
      beds: property.bedrooms,
      baths: property.bathrooms,
      sqft: property.square_feet,
      location: property.city,
      images: property.property_images?.map(img => img.image_url) || [],
      image: property.property_images?.[0]?.image_url,
      facilities: property.property_facilities?.map(pf => pf.facilities?.name).filter(Boolean) || [],
      rating: averageRating,
      reviews: reviewCount,
    };
  });
};

export const createProperty = async (propertyData, userId) => {
  try {
    // Upload images to Supabase storage using Uint8Array
    const imageUrls = [];
    for (let i = 0; i < propertyData.images.length; i++) {
      const imageUri = propertyData.images[i];
      const fileName = `property_${Date.now()}_${i}.jpg`;
      const filePath = `${userId}/${fileName}`;

      console.log('Uploading image:', i + 1, 'of', propertyData.images.length);

      // Read local file bytes natively (avoids Android fetch() failures)
      const uint8Array = await readImageBytes(imageUri);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}. Please ensure the 'property-images' storage bucket exists in Supabase with proper RLS policies.`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      imageUrls.push({
        image_url: publicUrl,
        is_primary: i === 0,
      });

      console.log('Image uploaded successfully:', publicUrl);
    }

    console.log('Creating property with', imageUrls.length, 'images');
    console.log('User ID:', userId);
    console.log('Property data:', {
      title: propertyData.name,
      type: propertyData.type,
      category: propertyData.category,
      city: propertyData.location,
      address: propertyData.location,
      price: propertyData.price,
      bedrooms: propertyData.beds,
      bathrooms: propertyData.baths,
      square_feet: propertyData.sqft,
      description: propertyData.description,
      host_id: userId,
      latitude: propertyData.latitude,
      longitude: propertyData.longitude,
      status: 'active',
    });

    // Create property record
    let property, propertyError;
    try {
      const result = await supabase
        .from('properties')
        .insert({
          title: propertyData.name,
          type: propertyData.type,
          category: propertyData.category,
          city: propertyData.location,
          address: propertyData.location,
          price: propertyData.price,
          bedrooms: propertyData.beds,
          bathrooms: propertyData.baths,
          square_feet: propertyData.sqft,
          description: propertyData.description,
          host_id: userId,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          status: 'active',
        })
        .select()
        .single();
      
      property = result.data;
      propertyError = result.error;
      console.log('Insert result:', { property, propertyError });
    } catch (networkError) {
      console.error('Network error during insert:', networkError);
      throw new Error(`Network error: ${networkError.message}`);
    }

    if (propertyError) {
      console.error('Property creation error:', propertyError);
      console.error('Error details:', JSON.stringify(propertyError, null, 2));
      throw new Error(`Failed to create property: ${propertyError.message}`);
    }

    // Insert property images with public URLs
    let imagesError;
    try {
      const result = await supabase
        .from('property_images')
        .insert(
          imageUrls.map(img => ({
            property_id: property.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          }))
        );
      imagesError = result.error;
    } catch (networkError) {
      console.error('Network error during images insert:', networkError);
      imagesError = networkError;
    }

    if (imagesError) {
      console.error('Images insertion error:', imagesError);
      // Don't throw - property was created successfully, images can be added later
    }

    // Handle facilities if provided
    if (propertyData.facilities && propertyData.facilities.length > 0) {
      // Look up facility IDs by name
      const { data: facilityData, error: facilityLookupError } = await supabase
        .from('facilities')
        .select('id, name')
        .in('name', propertyData.facilities);

      if (facilityLookupError) {
        console.error('Facility lookup error:', facilityLookupError);
      } else if (facilityData && facilityData.length > 0) {
        const { error: facilitiesError } = await supabase
          .from('property_facilities')
          .insert(
            facilityData.map(facility => ({
              property_id: property.id,
              facility_id: facility.id,
            }))
          );

        if (facilitiesError) {
          console.error('Facilities error:', facilitiesError);
          // Don't throw - property was created successfully
        }
      }
    }

    return property;
  } catch (error) {
    console.error('Create property error:', error);
    throw error;
  }
};

// Delete property
export const deleteProperty = async (propertyId) => {
  try {
    // Delete property images from storage
    const { data: images } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', propertyId);

    if (images && images.length > 0) {
      for (const image of images) {
        const fileName = image.image_url.split('/').pop();
        await supabase.storage
          .from('property-images')
          .remove([fileName]);
      }
    }

    // Delete property (cascade will handle related records)
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) {
      console.error('Delete property error:', error);
      throw new Error(`Failed to delete property: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete property error:', error);
    throw error;
  }
};

// Update property
export const updateProperty = async (propertyId, propertyData, userId) => {
  try {
    // Upload new images if provided
    let imageUrls = [];
    if (propertyData.images && propertyData.images.length > 0) {
      for (let i = 0; i < propertyData.images.length; i++) {
        const image = propertyData.images[i];
        if (image.uri) {
          const fileName = `${userId}/property_${Date.now()}_${i}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(fileName, image, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(fileName);

          imageUrls.push({
            image_url: publicUrl,
            is_primary: i === 0,
          });
        }
      }
    }

    // Update property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .update({
        title: propertyData.name,
        type: propertyData.type,
        category: propertyData.category,
        city: propertyData.location,
        address: propertyData.location,
        price: propertyData.price,
        bedrooms: propertyData.beds,
        bathrooms: propertyData.baths,
        square_feet: propertyData.sqft,
        description: propertyData.description,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (propertyError) {
      console.error('Property update error:', propertyError);
      throw new Error(`Failed to update property: ${propertyError.message}`);
    }

    // Delete old images and insert new ones if provided
    if (imageUrls.length > 0) {
      // Delete old images
      const { data: oldImages } = await supabase
        .from('property_images')
        .select('image_url')
        .eq('property_id', propertyId);

      if (oldImages && oldImages.length > 0) {
        for (const oldImage of oldImages) {
          const fileName = oldImage.image_url.split('/').pop();
          await supabase.storage
            .from('property-images')
            .remove([fileName]);
        }
      }

      // Delete old image records
      await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId);

      // Insert new images
      const { error: imagesError } = await supabase
        .from('property_images')
        .insert(
          imageUrls.map(img => ({
            property_id: property.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          }))
        );

      if (imagesError) {
        console.error('Images insertion error:', imagesError);
        throw new Error(`Failed to save property images: ${imagesError.message}`);
      }
    }

    // Handle facilities - always delete old first, then insert new
    // Delete old facilities
    const { error: deleteFacilitiesError } = await supabase
      .from('property_facilities')
      .delete()
      .eq('property_id', propertyId);

    if (deleteFacilitiesError) {
      console.error('Delete facilities error:', deleteFacilitiesError);
    }

    // Insert new facilities if provided
    if (propertyData.facilities && propertyData.facilities.length > 0) {
      // Look up facility IDs by name
      const { data: facilityData, error: facilityLookupError } = await supabase
        .from('facilities')
        .select('id, name')
        .in('name', propertyData.facilities);

      if (facilityLookupError) {
        console.error('Facility lookup error:', facilityLookupError);
      } else if (facilityData && facilityData.length > 0) {
        const { error: facilitiesError } = await supabase
          .from('property_facilities')
          .insert(
            facilityData.map(facility => ({
              property_id: property.id,
              facility_id: facility.id,
            }))
          );

        if (facilitiesError) {
          console.error('Facilities error:', facilitiesError);
        }
      }
    }

    return property;
  } catch (error) {
    console.error('Update property error:', error);
    throw error;
  }
};

// Favorites API
export const getFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      properties(*, property_images(image_url, is_primary))
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const toggleFavorite = async (userId, itemId, isRoommate = false) => {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq(isRoommate ? 'roommate_listing_id' : 'property_id', itemId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return false;
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        [isRoommate ? 'roommate_listing_id' : 'property_id']: itemId
      });
    
    if (error) throw error;
    return true;
  }
};

// Bookings API
export const getBookings = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      properties(title, city, address, property_images(image_url, is_primary)),
      payments(status, amount)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      reference: `BK${Date.now()}`,
      ...bookingData
    })
    .select('id, reference, user_id, property_id, check_in_date, check_out_date, guests, total_amount, status, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

// Roommate Listings API
export const getRoommateListings = async (filters = {}) => {
  console.log('Fetching roommate listings with filters:', filters);
  let query = supabase
    .from('roommate_listings')
    .select(`
      *,
      roommate_images(image_url, is_primary),
      profiles(full_name, avatar_url)
    `)
    .eq('is_active', true);

  if (filters.type) {
    // Filter by type (would need to be stored in the table or derived)
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.minBudget) {
    query = query.gte('budget_min', filters.minBudget);
  }
  if (filters.maxBudget) {
    query = query.lte('budget_max', filters.maxBudget);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching roommate listings:', error);
    throw error;
  }

  console.log('Roommate listings fetched:', data?.length || 0);
  
  // Transform data to match component expectations
  return data.map(listing => ({
    ...listing,
    location: listing.city || listing.address || '',
    price: listing.budget_min || listing.budget_max || 0,
    available: listing.move_in_date || '',
    postedBy: {
      id: listing.user_id,
      name: listing.profiles?.full_name || 'Unknown',
      avatar: listing.profiles?.avatar_url,
      age: listing.age,
      occupation: listing.occupation || 'Not specified',
    },
    images: listing.roommate_images?.map(img => img.image_url) || [],
    type: 'Apartment', // Default type, should be stored in DB
    preferences: [], // Should be stored in DB
    amenities: [], // Should be stored in DB
  }));
};

export const createRoommateListing = async (listingData, userId) => {
  try {
    // Upload images to Supabase storage
    const imageUrls = [];
    for (let i = 0; i < listingData.images.length; i++) {
      const imageUri = listingData.images[i];
      const fileName = `roommate_${Date.now()}_${i}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Read local file bytes natively (avoids Android fetch() failures)
      const uint8Array = await readImageBytes(imageUri);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('roommate-images')
        .upload(filePath, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('roommate-images')
        .getPublicUrl(filePath);

      imageUrls.push({
        image_url: publicUrl,
        is_primary: i === 0,
      });
    }

    // Create roommate listing record
    const { data: listing, error: listingError } = await supabase
      .from('roommate_listings')
      .insert({
        user_id: userId,
        title: listingData.title,
        description: listingData.description,
        address: listingData.location,
        city: listingData.location,
        state: 'WA',
        country: 'USA',
        age: listingData.age,
        occupation: listingData.occupation,
        budget_min: listingData.price,
        budget_max: listingData.price,
        move_in_date: listingData.available,
        sleep_schedule: listingData.sleepSchedule,
        work_schedule: listingData.workSchedule,
        dietary_preference: listingData.dietaryPreference,
        languages: listingData.languages ? listingData.languages.split(',').map(l => l.trim()) : [],
        social_style: listingData.socialStyle,
        cleanliness_level: listingData.cleanlinessLevel,
        guest_policy: listingData.guestPolicy,
        noise_tolerance: listingData.noiseTolerance,
        cooking_habits: listingData.cookingHabits,
        alcohol_consumption: listingData.alcoholConsumption,
        work_environment: listingData.workEnvironment,
        dietary_allergies: listingData.dietaryAllergies,
        preferences: listingData.preferences || [],
        amenities: listingData.amenities || [],
        is_active: true,
      })
      .select()
      .single();

    if (listingError) {
      console.error('Roommate listing creation error:', listingError);
      throw new Error(`Failed to create roommate listing: ${listingError.message}`);
    }

    // Insert roommate images
    if (imageUrls.length > 0) {
      const { error: imagesError } = await supabase
        .from('roommate_images')
        .insert(
          imageUrls.map(img => ({
            listing_id: listing.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
          }))
        );

      if (imagesError) {
        console.error('Images insertion error:', imagesError);
      }
    }

    return listing;
  } catch (error) {
    console.error('Create roommate listing error:', error);
    throw error;
  }
};

export const getUserRoommateListings = async (userId) => {
  const { data, error } = await supabase
    .from('roommate_listings')
    .select(`
      *,
      roommate_images(image_url, is_primary),
      profiles(full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user roommate listings:', error);
    throw error;
  }

  return data.map(listing => ({
    ...listing,
    location: listing.city || listing.address || '',
    postedBy: {
      id: listing.user_id,
      name: listing.profiles?.full_name || 'Unknown',
      avatar: listing.profiles?.avatar_url,
      age: listing.age,
      occupation: listing.occupation || 'Not specified',
    },
    images: listing.roommate_images?.map(img => img.image_url) || [],
    type: 'Apartment',
    preferences: listing.preferences || [],
    amenities: listing.amenities || [],
    sleepSchedule: listing.sleep_schedule,
    workSchedule: listing.work_schedule,
    dietaryPreference: listing.dietary_preference,
    languages: listing.languages || [],
    socialStyle: listing.social_style,
    cleanlinessLevel: listing.cleanliness_level,
    guestPolicy: listing.guest_policy,
    noiseTolerance: listing.noise_tolerance,
    cookingHabits: listing.cooking_habits,
    alcoholConsumption: listing.alcohol_consumption,
    workEnvironment: listing.work_environment,
    dietaryAllergies: listing.dietary_allergies,
    available: listing.move_in_date,
    price: listing.budget_min,
  }));
};

export const deleteRoommateListing = async (listingId) => {
  const { error } = await supabase
    .from('roommate_listings')
    .delete()
    .eq('id', listingId);

  if (error) {
    console.error('Error deleting roommate listing:', error);
    throw error;
  }
  return true;
};

export const updateRoommateListing = async (listingId, listingData, userId) => {
  try {
    // Upload any new images (local URIs) and keep existing remote URLs
    const imageRecords = [];
    for (let i = 0; i < (listingData.images || []).length; i++) {
      const imageUri = listingData.images[i];
      if (imageUri.startsWith('http')) {
        imageRecords.push({ image_url: imageUri, is_primary: i === 0 });
        continue;
      }
      const fileName = `roommate_${Date.now()}_${i}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Read local file bytes natively (avoids Android fetch() failures)
      const uint8Array = await readImageBytes(imageUri);

      const { error: uploadError } = await supabase.storage
        .from('roommate-images')
        .upload(filePath, uint8Array, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('roommate-images')
        .getPublicUrl(filePath);

      imageRecords.push({ image_url: publicUrl, is_primary: i === 0 });
    }

    const { data: listing, error: listingError } = await supabase
      .from('roommate_listings')
      .update({
        title: listingData.title,
        description: listingData.description,
        address: listingData.location,
        city: listingData.location,
        age: listingData.age,
        occupation: listingData.occupation,
        budget_min: listingData.price,
        budget_max: listingData.price,
        move_in_date: listingData.available,
        sleep_schedule: listingData.sleepSchedule,
        work_schedule: listingData.workSchedule,
        dietary_preference: listingData.dietaryPreference,
        languages: listingData.languages ? listingData.languages.split(',').map(l => l.trim()) : [],
        social_style: listingData.socialStyle,
        cleanliness_level: listingData.cleanlinessLevel,
        guest_policy: listingData.guestPolicy,
        noise_tolerance: listingData.noiseTolerance,
        cooking_habits: listingData.cookingHabits,
        alcohol_consumption: listingData.alcoholConsumption,
        work_environment: listingData.workEnvironment,
        dietary_allergies: listingData.dietaryAllergies,
        preferences: listingData.preferences || [],
        amenities: listingData.amenities || [],
      })
      .eq('id', listingId)
      .select()
      .single();

    if (listingError) {
      console.error('Roommate listing update error:', listingError);
      throw new Error(`Failed to update roommate listing: ${listingError.message}`);
    }

    // Replace images: delete existing then insert new set
    await supabase.from('roommate_images').delete().eq('listing_id', listingId);
    if (imageRecords.length > 0) {
      const { error: imagesError } = await supabase
        .from('roommate_images')
        .insert(imageRecords.map(img => ({
          listing_id: listingId,
          image_url: img.image_url,
          is_primary: img.is_primary,
        })));
      if (imagesError) {
        console.error('Images insertion error:', imagesError);
      }
    }

    return listing;
  } catch (error) {
    console.error('Update roommate listing error:', error);
    throw error;
  }
};

// Conversations API
export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      properties(title, property_images(image_url, is_primary)),
      profiles!conversations_other_user_id_fkey(full_name, avatar_url)
    `)
    .or(`user_id.eq.${userId},other_user_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const sendMessage = async (conversationId, senderId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      status: 'sent'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createConversation = async (userId, otherUserId, propertyId = null) => {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('other_user_id', otherUserId)
    .eq('property_id', propertyId)
    .single();

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      other_user_id: otherUserId,
      property_id: propertyId,
    })
    .select()
    .single();

  if (error) throw error;

  // Track property inquiry if property_id exists
  if (propertyId) {
    await supabase
      .from('property_inquiries')
      .insert({
        property_id: propertyId,
        user_id: userId,
        conversation_id: data.id,
      });
  }

  return data;
};

export const deleteMessageFromDB = async (messageId) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
  return true;
};

// Notifications API
export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
};

// Analytics API
export const trackPropertyView = async (propertyId, userId = null) => {
  const { data, error } = await supabase
    .from('property_views')
    .insert({
      property_id: propertyId,
      user_id: userId,
      session_id: userId ? null : 'anonymous',
    });

  if (error) {
    console.error('Error tracking property view:', error);
  }
  return data;
};

export const getPropertyAnalytics = async (propertyId) => {
  const { data, error } = await supabase
    .from('properties')
    .select('view_count, favorite_count, inquiry_count, rating_avg, review_count')
    .eq('id', propertyId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserPropertyAnalytics = async (userId) => {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, view_count, favorite_count, inquiry_count, rating_avg, review_count, status')
    .eq('host_id', userId)
    .is('deleted_at', null)
    .order('view_count', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAnalyticsSummary = async (userId) => {
  // Get user's properties
  const { data: properties, error: propsError } = await supabase
    .from('properties')
    .select('id, view_count, favorite_count, inquiry_count, rating_avg, review_count, status')
    .eq('host_id', userId)
    .is('deleted_at', null);

  if (propsError) throw propsError;

  // Get user's bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('total_amount, created_at, status')
    .eq('user_id', userId);

  if (bookingsError) throw bookingsError;

  // Calculate summary
  const totalViews = properties.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalFavorites = properties.reduce((sum, p) => sum + (p.favorite_count || 0), 0);
  const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiry_count || 0), 0);
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const averageRating = properties.length > 0
    ? properties.reduce((sum, p) => sum + (p.rating_avg || 0), 0) / properties.length
    : 0;
  const activeProperties = properties.filter(p => p.status === 'active').length;

  return {
    totalViews,
    totalFavorites,
    totalInquiries,
    totalBookings,
    totalRevenue,
    averageRating: Math.round(averageRating * 10) / 10,
    activeProperties,
    properties,
    bookings,
  };
};

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
};

// Search History API
export const getSearchHistory = async (userId) => {
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
};

export const saveSearchHistory = async (userId, query, filters, resultsCount) => {
  const { error } = await supabase
    .from('search_history')
    .insert({
      user_id: userId,
      query,
      filters,
      results_count: resultsCount
    });

  if (error) throw error;
};

// Profile API
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Upload profile image to Supabase Storage
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    const fileName = `profile_${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    // Read local file bytes natively (avoids Android fetch() failures)
    const uint8Array = await readImageBytes(imageUri);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Profile image upload error:', uploadError);
      throw new Error(`Failed to upload profile image: ${uploadError.message}. Please ensure the 'profile-images' storage bucket exists in Supabase with proper RLS policies.`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Upload profile image error:', error);
    throw error;
  }
};

// Facilities API
export const getFacilities = async () => {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

// Reviews API
export const getPropertyReviews = async (propertyId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles(full_name, avatar_url)
    `)
    .eq('property_id', propertyId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: reviewData.userId,
      property_id: reviewData.propertyId,
      rating: reviewData.rating,
      title: reviewData.title,
      content: reviewData.content,
      is_visible: true,
      is_verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPropertyRating = async (propertyId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('property_id', propertyId)
    .eq('is_visible', true);

  if (error) throw error;
  
  if (!data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / data.length;
  
  return { average: Math.round(average * 10) / 10, count: data.length };
};
