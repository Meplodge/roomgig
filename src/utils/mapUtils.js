/**
 * Utility functions for map-related operations
 */

/**
 * Fetch directions from origin to destination using OSRM (Open Source Routing Machine)
 * This is a free service that doesn't require an API key
 * @param {Object} origin - {latitude, longitude}
 * @param {Object} destination - {latitude, longitude}
 * @returns {Promise<Object>} - Route data with coordinates, distance, and duration
 */
export const getDirections = async (origin, destination) => {
  try {
    // OSRM public demo server (free, no API key required)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    
    console.log('Fetching directions from:', url);
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('OSRM Response:', data);
    
    if (data.code !== 'Ok') {
      throw new Error(data.message || 'Failed to fetch directions');
    }
    
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
    
    console.log('Parsed coordinates:', coordinates.length, 'points');
    console.log('First coordinate:', coordinates[0]);
    console.log('Last coordinate:', coordinates[coordinates.length - 1]);
    
    // Convert distance from meters to appropriate unit
    const distanceMeters = route.distance;
    const distanceText = distanceMeters < 1000 
      ? `${Math.round(distanceMeters)} m` 
      : `${(distanceMeters / 1000).toFixed(1)} km`;
    
    // Convert duration from seconds to appropriate unit
    const durationSeconds = route.duration;
    const durationText = durationSeconds < 60 
      ? `${Math.round(durationSeconds)} sec` 
      : durationSeconds < 3600 
      ? `${Math.round(durationSeconds / 60)} min` 
      : `${Math.floor(durationSeconds / 3600)}h ${Math.round((durationSeconds % 3600) / 60)}min`;
    
    const result = {
      coordinates,
      distance: distanceText,
      duration: durationText,
      distanceValue: distanceMeters,
      durationValue: durationSeconds,
    };
    
    console.log('Returning directions result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};


/**
 * Calculate distance between two points using Haversine formula (in km)
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};
