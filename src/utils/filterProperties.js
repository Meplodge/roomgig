export const filterProperties = (properties, { filters, query } = {}) => {
  const f = filters || {};
  const q = (query || '').trim().toLowerCase();

  console.log('Filtering properties:', properties.length, 'properties');
  console.log('Filters:', JSON.stringify(f));
  console.log('Query:', q);

  return properties.filter((p) => {
    console.log('Checking property:', p.name, 'type:', p.type, 'price:', p.price);
    
    // Search by name or location
    if (q) {
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      if (!matches) {
        console.log('Filtered out by query:', q);
        return false;
      }
    }

    // Type (case-insensitive comparison)
    if (f.type && f.type !== 'All' && p.type?.toLowerCase() !== f.type.toLowerCase()) {
      console.log('Filtered out by type:', f.type, 'vs', p.type);
      return false;
    }

    // Price range
    if (f.priceRange) {
      const [min, max] = f.priceRange;
      if (p.price < min || p.price > max) {
        console.log('Filtered out by price range:', f.priceRange, 'vs', p.price);
        return false;
      }
    }

    // Beds / baths
    if (f.minBeds && p.beds < f.minBeds) {
      console.log('Filtered out by beds:', f.minBeds, 'vs', p.beds);
      return false;
    }
    if (f.minBaths && p.baths < f.minBaths) {
      console.log('Filtered out by baths:', f.minBaths, 'vs', p.baths);
      return false;
    }

    console.log('Property passed all filters');
    return true;
  });
};

export const countActiveFilters = (filters) => {
  if (!filters) return 0;
  let count = 0;
  if (filters.type && filters.type !== 'All') count += 1;
  if (filters.priceRange) count += 1;
  if (filters.minBeds) count += 1;
  if (filters.minBaths) count += 1;
  return count;
};
