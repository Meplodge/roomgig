export const filterProperties = (properties, { filters, query } = {}) => {
  const f = filters || {};
  const q = (query || '').trim().toLowerCase();

  return properties.filter((p) => {
    // Search by name or location
    if (q) {
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Type
    if (f.type && f.type !== 'All' && p.type !== f.type) return false;

    // Price range
    if (f.priceRange) {
      const [min, max] = f.priceRange;
      if (p.price < min || p.price > max) return false;
    }

    // Beds / baths
    if (f.minBeds && p.beds < f.minBeds) return false;
    if (f.minBaths && p.baths < f.minBaths) return false;

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
