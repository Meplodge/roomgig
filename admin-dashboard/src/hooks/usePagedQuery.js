import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Server-side pagination + filtering + sorting for the list pages.
 * Filters are plain query params; changing any of them resets to page 1.
 */
export const usePagedQuery = (key, path, { initialFilters = {}, initialSort, pageSize: initialPageSize = 25 } = {}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort || null);

  const params = useMemo(
    () => ({
      ...filters,
      page,
      pageSize,
      ...(sort ? { sort: sort.key, dir: sort.dir } : {}),
    }),
    [filters, page, pageSize, sort]
  );

  const query = useQuery({
    queryKey: [key, params],
    queryFn: () => api.get(path, params),
  });

  const setFilter = useCallback((name, value) => {
    setPage(1);
    setFilters((current) => {
      const next = { ...current };
      if (value === '' || value === undefined || value === null) delete next[name];
      else next[name] = value;
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    query,
    rows: query.data?.data || [],
    total: query.data?.count || 0,
    page,
    setPage,
    pageSize,
    setPageSize: (size) => {
      setPage(1);
      setPageSize(size);
    },
    filters,
    setFilter,
    resetFilters,
    sort,
    setSort,
  };
};

/** Wraps a mutating API call with busy state and toast reporting. */
export const useAction = (toast, onDone) => {
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const result = await fn();
        if (successMessage) toast.success(successMessage);
        await onDone?.();
        return result;
      } catch (error) {
        toast.error(error.message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast, onDone]
  );

  return { busy, run };
};
