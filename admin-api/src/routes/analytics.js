const express = require('express');
const { supabase } = require('../supabase');
const { parseRange, asyncRoute, throwOnSupabaseError, badRequest } = require('../utils');

const router = express.Router();

const METRICS = [
  'signups',
  'listings',
  'roommate_listings',
  'views',
  'bookings',
  'revenue',
  'messages',
  'favorites',
  'searches',
];
const BUCKETS = ['hour', 'day', 'week', 'month'];

router.get(
  '/kpis',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const { data, error } = await supabase.rpc('admin_kpis', { p_from: from, p_to: to });
    throwOnSupabaseError(error, 'loading KPIs');
    res.json({ data, range: { from, to } });
  })
);

router.get(
  '/timeseries',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const metric = req.query.metric || 'signups';
    const bucket = req.query.bucket || 'day';
    if (!METRICS.includes(metric)) throw badRequest(`Unknown metric: ${metric}`);
    if (!BUCKETS.includes(bucket)) throw badRequest(`Unknown bucket: ${bucket}`);

    const { data, error } = await supabase.rpc('admin_timeseries', {
      p_metric: metric,
      p_bucket: bucket,
      p_from: from,
      p_to: to,
    });
    throwOnSupabaseError(error, 'loading time series');
    res.json({ data: data || [], metric, bucket, range: { from, to } });
  })
);

/** Current window + the equal-length window before it, for comparison charts. */
router.get(
  '/timeseries/compare',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const metric = req.query.metric || 'revenue';
    const bucket = req.query.bucket || 'day';
    if (!METRICS.includes(metric)) throw badRequest(`Unknown metric: ${metric}`);
    if (!BUCKETS.includes(bucket)) throw badRequest(`Unknown bucket: ${bucket}`);

    const span = new Date(to).getTime() - new Date(from).getTime();
    const prevFrom = new Date(new Date(from).getTime() - span).toISOString();

    const [current, previous] = await Promise.all([
      supabase.rpc('admin_timeseries', {
        p_metric: metric,
        p_bucket: bucket,
        p_from: from,
        p_to: to,
      }),
      supabase.rpc('admin_timeseries', {
        p_metric: metric,
        p_bucket: bucket,
        p_from: prevFrom,
        p_to: from,
      }),
    ]);
    throwOnSupabaseError(current.error, 'loading current series');
    throwOnSupabaseError(previous.error, 'loading previous series');

    // Zip by index so the two windows overlay on a shared x-axis.
    const prev = previous.data || [];
    const data = (current.data || []).map((point, i) => ({
      bucket: point.bucket,
      value: Number(point.value) || 0,
      previous: Number(prev[i]?.value) || 0,
    }));

    res.json({ data, metric, bucket, range: { from, to } });
  })
);

router.get(
  '/top-cities',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.rpc('admin_top_cities', {
      p_limit: parseInt(req.query.limit, 10) || 10,
    });
    throwOnSupabaseError(error, 'loading top cities');
    res.json({ data: data || [] });
  })
);

router.get(
  '/top-listings',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.rpc('admin_top_listings', {
      p_limit: parseInt(req.query.limit, 10) || 10,
    });
    throwOnSupabaseError(error, 'loading top listings');
    res.json({ data: data || [] });
  })
);

router.get(
  '/views-by-weekday',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const { data, error } = await supabase.rpc('admin_views_by_weekday', {
      p_from: from,
      p_to: to,
    });
    throwOnSupabaseError(error, 'loading weekday views');
    res.json({ data: data || [] });
  })
);

router.get(
  '/listing-breakdown',
  asyncRoute(async (req, res) => {
    const dimension = req.query.dimension || 'category';
    if (!['category', 'type', 'status'].includes(dimension)) {
      throw badRequest(`Unknown dimension: ${dimension}`);
    }
    const { data, error } = await supabase.rpc('admin_listing_breakdown', {
      p_dimension: dimension,
    });
    throwOnSupabaseError(error, 'loading listing breakdown');
    res.json({ data: data || [], dimension });
  })
);

router.get(
  '/top-searches',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.rpc('admin_top_searches', {
      p_limit: parseInt(req.query.limit, 10) || 15,
    });
    throwOnSupabaseError(error, 'loading top searches');
    res.json({ data: data || [] });
  })
);

router.get(
  '/rating-distribution',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.rpc('admin_rating_distribution');
    throwOnSupabaseError(error, 'loading rating distribution');
    res.json({ data: data || [] });
  })
);

module.exports = router;
