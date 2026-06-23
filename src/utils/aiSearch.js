/**
 * AI-powered search utilities using on-device AI
 * Falls back to basic parsing if native module is not available
 */

let aiModule = null;
let isInitialized = false;

/**
 * Initialize the on-device AI module
 */
export const initializeAI = async () => {
  if (isInitialized) return true;
  
  try {
    // Try to import the module dynamically
    aiModule = await import('expo-ondevice-ai');
    await aiModule.initialize();
    isInitialized = true;
    console.log('On-device AI initialized successfully');
    return true;
  } catch (error) {
    console.log('On-device AI not available, using basic parsing:', error.message);
    aiModule = null;
    isInitialized = false;
    return false;
  }
};

/**
 * Parse natural language search query to extract search criteria
 * Example: "2 bedroom apartment under $2000 near downtown"
 * Returns: { bedrooms: 2, type: 'apartment', maxPrice: 2000, location: 'downtown' }
 */
export const parseSearchQuery = async (query) => {
  try {
    const aiAvailable = await initializeAI();
    if (!aiAvailable || !aiModule) {
      // Fallback to basic parsing if AI is not available
      return parseQueryBasic(query);
    }

    // Use AI to extract entities from the query
    const entities = await aiModule.extract(query, {
      entityTypes: ['number', 'location', 'price', 'property_type']
    });

    const criteria = {
      bedrooms: null,
      bathrooms: null,
      minPrice: null,
      maxPrice: null,
      type: null,
      location: null,
      amenities: []
    };

    // Parse the extracted entities
    entities.forEach(entity => {
      const { type, value, text } = entity;
      
      switch (type) {
        case 'number':
          // Check if it's bedrooms or bathrooms based on context
          if (text.toLowerCase().includes('bedroom') || text.toLowerCase().includes('bed')) {
            criteria.bedrooms = parseInt(value);
          } else if (text.toLowerCase().includes('bathroom') || text.toLowerCase().includes('bath')) {
            criteria.bathrooms = parseInt(value);
          }
          break;
          
        case 'price':
          const priceValue = parseInt(value.replace(/[^0-9]/g, ''));
          if (text.toLowerCase().includes('under') || text.toLowerCase().includes('less than') || text.toLowerCase().includes('below')) {
            criteria.maxPrice = priceValue;
          } else if (text.toLowerCase().includes('over') || text.toLowerCase().includes('more than') || text.toLowerCase().includes('above')) {
            criteria.minPrice = priceValue;
          } else {
            criteria.maxPrice = priceValue;
          }
          break;
          
        case 'location':
          criteria.location = value;
          break;
          
        case 'property_type':
          criteria.type = value.toLowerCase();
          break;
      }
    });

    // Fallback: check for keywords in the query
    const lowerQuery = query.toLowerCase();
    
    // Property types
    if (lowerQuery.includes('apartment') || lowerQuery.includes('flat')) {
      criteria.type = 'apartment';
    } else if (lowerQuery.includes('house') || lowerQuery.includes('home')) {
      criteria.type = 'house';
    } else if (lowerQuery.includes('condo') || lowerQuery.includes('condominium')) {
      criteria.type = 'condo';
    } else if (lowerQuery.includes('villa')) {
      criteria.type = 'villa';
    } else if (lowerQuery.includes('studio')) {
      criteria.type = 'studio';
    }

    // Amenities
    if (lowerQuery.includes('pool')) criteria.amenities.push('pool');
    if (lowerQuery.includes('gym') || lowerQuery.includes('fitness')) criteria.amenities.push('gym');
    if (lowerQuery.includes('parking') || lowerQuery.includes('garage')) criteria.amenities.push('parking');
    if (lowerQuery.includes('garden') || lowerQuery.includes('yard')) criteria.amenities.push('garden');

    return criteria;
  } catch (error) {
    console.log('AI parsing failed, using basic fallback:', error);
    return parseQueryBasic(query);
  }
};

/**
 * Basic query parsing as fallback when AI is not available
 */
const parseQueryBasic = (query) => {
  const criteria = {
    bedrooms: null,
    bathrooms: null,
    minPrice: null,
    maxPrice: null,
    type: null,
    location: null,
    amenities: []
  };

  const lowerQuery = query.toLowerCase();

  // Extract numbers for bedrooms/bathrooms
  const bedMatch = lowerQuery.match(/(\d+)\s*(?:bedroom|bed)/i);
  if (bedMatch) criteria.bedrooms = parseInt(bedMatch[1]);

  const bathMatch = lowerQuery.match(/(\d+)\s*(?:bathroom|bath)/i);
  if (bathMatch) criteria.bathrooms = parseInt(bathMatch[1]);

  // Extract price
  const priceMatch = lowerQuery.match(/\$?(\d+,?\d*)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(',', ''));
    if (lowerQuery.includes('under') || lowerQuery.includes('less') || lowerQuery.includes('below')) {
      criteria.maxPrice = price;
    } else if (lowerQuery.includes('over') || lowerQuery.includes('more') || lowerQuery.includes('above')) {
      criteria.minPrice = price;
    } else {
      criteria.maxPrice = price;
    }
  }

  // Property types
  if (lowerQuery.includes('apartment') || lowerQuery.includes('flat')) {
    criteria.type = 'apartment';
  } else if (lowerQuery.includes('house') || lowerQuery.includes('home')) {
    criteria.type = 'house';
  } else if (lowerQuery.includes('condo')) {
    criteria.type = 'condo';
  } else if (lowerQuery.includes('villa')) {
    criteria.type = 'villa';
  } else if (lowerQuery.includes('studio')) {
    criteria.type = 'studio';
  }

  // Location (simple extraction)
  const locationKeywords = ['downtown', 'suburb', 'beach', 'mountain', 'city', 'rural'];
  locationKeywords.forEach(keyword => {
    if (lowerQuery.includes(keyword)) {
      criteria.location = keyword;
    }
  });

  // Amenities
  if (lowerQuery.includes('pool')) criteria.amenities.push('pool');
  if (lowerQuery.includes('gym') || lowerQuery.includes('fitness')) criteria.amenities.push('gym');
  if (lowerQuery.includes('parking') || lowerQuery.includes('garage')) criteria.amenities.push('parking');
  if (lowerQuery.includes('garden') || lowerQuery.includes('yard')) criteria.amenities.push('garden');

  return criteria;
};

/**
 * Classify property description to extract key features
 */
export const classifyProperty = async (description) => {
  try {
    const aiAvailable = await initializeAI();
    if (!aiAvailable || !aiModule) {
      return null;
    }

    const classification = await aiModule.classify(description, {
      categories: ['luxury', 'budget', 'family_friendly', 'pet_friendly', 'modern', 'historic']
    });

    return classification;
  } catch (error) {
    console.log('Property classification failed:', error);
    return null;
  }
};

/**
 * Generate smart search suggestions based on partial input
 */
export const getSearchSuggestions = async (partialQuery) => {
  const suggestions = [
    '2 bedroom apartment',
    'House with garden',
    'Studio under $1500',
    'Luxury condo downtown',
    'Pet friendly apartment',
    '3 bedroom house with parking'
  ];

  // Filter suggestions based on partial query
  if (partialQuery) {
    return suggestions.filter(s => 
      s.toLowerCase().includes(partialQuery.toLowerCase())
    );
  }

  return suggestions;
};
