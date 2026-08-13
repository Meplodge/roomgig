import { createContext, useContext, useMemo, useState } from 'react';

/**
 * The date range chosen in the top bar drives every page, so it lives above the
 * router rather than in each page's own state.
 */
const RangeContext = createContext(null);

export const PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7, bucket: 'day' },
  { id: '30d', label: 'Last 30 days', days: 30, bucket: 'day' },
  { id: '90d', label: 'Last 90 days', days: 90, bucket: 'week' },
  { id: '12m', label: 'Last 12 months', days: 365, bucket: 'month' },
  { id: 'all', label: 'All time', days: 3650, bucket: 'month' },
];

const rangeFor = (preset) => {
  const to = new Date();
  const from = new Date(to.getTime() - preset.days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString(), bucket: preset.bucket };
};

export const RangeProvider = ({ children }) => {
  const [presetId, setPresetId] = useState('30d');
  const [custom, setCustom] = useState(null); // { from, to }

  const value = useMemo(() => {
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[1];
    if (custom) {
      const span = new Date(custom.to).getTime() - new Date(custom.from).getTime();
      const days = span / (24 * 60 * 60 * 1000);
      const bucket = days <= 2 ? 'hour' : days <= 60 ? 'day' : days <= 365 ? 'week' : 'month';
      return {
        presetId: 'custom',
        setPresetId,
        custom,
        setCustom,
        label: 'Custom range',
        from: new Date(custom.from).toISOString(),
        to: new Date(custom.to).toISOString(),
        bucket,
      };
    }
    return {
      presetId,
      setPresetId: (id) => {
        setCustom(null);
        setPresetId(id);
      },
      custom: null,
      setCustom,
      label: preset.label,
      ...rangeFor(preset),
    };
  }, [presetId, custom]);

  return <RangeContext.Provider value={value}>{children}</RangeContext.Provider>;
};

export const useRange = () => {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error('useRange must be used inside RangeProvider');
  return ctx;
};
