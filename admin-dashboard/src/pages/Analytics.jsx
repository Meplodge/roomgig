import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader, { ExportButton } from '../components/PageHeader';
import { Card, DataTable, EmptyState } from '../components/ui';
import { ComboChart, DonutChart, RankedBars, TrendChart } from '../components/charts';
import { api } from '../lib/api';
import { useRange } from '../context/RangeContext';
import {
  downloadCsv,
  formatMoney,
  formatNumber,
  formatPercent,
  titleCase,
} from '../lib/format';

const METRICS = [
  { id: 'signups', label: 'Signups' },
  { id: 'listings', label: 'Listings' },
  { id: 'roommate_listings', label: 'Roommate ads' },
  { id: 'views', label: 'Views' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'messages', label: 'Messages' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'searches', label: 'Searches' },
];

const Analytics = () => {
  const { from, to, bucket } = useRange();
  const [metric, setMetric] = useState('signups');
  const [dimension, setDimension] = useState('category');

  const series = useQuery({
    queryKey: ['analytics-series', metric, bucket, from, to],
    queryFn: () => api.get('/api/analytics/timeseries/compare', { metric, bucket, from, to }),
  });

  const funnelSource = useQuery({
    queryKey: ['kpis', from, to, bucket],
    queryFn: () => api.get('/api/analytics/kpis', { from, to }),
  });

  const cities = useQuery({
    queryKey: ['top-cities'],
    queryFn: () => api.get('/api/analytics/top-cities', { limit: 10 }),
  });

  const breakdown = useQuery({
    queryKey: ['listing-breakdown', dimension],
    queryFn: () => api.get('/api/analytics/listing-breakdown', { dimension }),
  });

  const searches = useQuery({
    queryKey: ['top-searches'],
    queryFn: () => api.get('/api/analytics/top-searches', { limit: 15 }),
  });

  const bookingsSeries = useQuery({
    queryKey: ['analytics-series', 'bookings', bucket, from, to],
    queryFn: () =>
      api.get('/api/analytics/timeseries/compare', { metric: 'bookings', bucket, from, to }),
  });

  const k = funnelSource.data?.data || {};
  const isMoney = metric === 'revenue';

  // views -> favorites -> inquiries -> bookings
  const funnel = [
    { label: 'Views', value: Number(k.total_views) || 0 },
    { label: 'Favorites', value: Number(k.total_favorites) || 0 },
    { label: 'Inquiries', value: Number(k.total_inquiries) || 0 },
    { label: 'Bookings', value: Number(k.total_bookings) || 0 },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Growth, engagement and demand"
        showRange
        actions={
          <ExportButton
            disabled={!series.data?.data?.length}
            onExport={() => downloadCsv(`roomgig-${metric}.csv`, series.data.data)}
          />
        }
      />

      <Card
        title="Metric over time"
        subtitle="Solid line is the selected range, dashed is the preceding one"
        actions={
          <select className="select" value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRICS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        }
      >
        <TrendChart
          data={series.data?.data}
          bucket={bucket}
          height={280}
          valueFormatter={isMoney ? (v) => formatMoney(v) : undefined}
        />
      </Card>

      <div className="grid-halves">
        <Card title="Bookings volume" subtitle="Bars: this period, line: previous">
          <ComboChart data={bookingsSeries.data?.data} bucket={bucket} height={240} />
        </Card>

        <Card
          title="Listing mix"
          actions={
            <select
              className="select"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
            >
              <option value="category">By category</option>
              <option value="type">By type</option>
              <option value="status">By status</option>
            </select>
          }
        >
          <DonutChart
            data={(breakdown.data?.data || []).map((row) => ({
              label: titleCase(row.label),
              value: Number(row.value),
            }))}
          />
        </Card>
      </div>

      <div className="grid-halves">
        <Card title="Demand funnel" subtitle="Lifetime totals across all listings">
          <RankedBars data={funnel} />
          <dl className="kv">
            <dt>View to favorite</dt>
            <dd>{formatPercent(funnel[0].value ? (funnel[1].value / funnel[0].value) * 100 : 0)}</dd>
            <dt>View to inquiry</dt>
            <dd>{formatPercent(funnel[0].value ? (funnel[2].value / funnel[0].value) * 100 : 0)}</dd>
            <dt>View to booking</dt>
            <dd>{formatPercent(funnel[0].value ? (funnel[3].value / funnel[0].value) * 100 : 0)}</dd>
          </dl>
          <p className="tiny muted">
            Views come from property_views, which has no de-duplication, so treat these ratios as
            directional rather than exact.
          </p>
        </Card>

        <Card className="flush" title="Top cities" subtitle="By listing count">
          <DataTable
            rows={cities.data?.data}
            loading={cities.isLoading}
            error={cities.error}
            onRetry={cities.refetch}
            rowKey={(row) => row.city}
            emptyTitle="No listings yet"
            columns={[
              { key: 'city', label: 'City' },
              {
                key: 'listings',
                label: 'Listings',
                align: 'right',
                render: (r) => <span className="num">{formatNumber(r.listings)}</span>,
              },
              {
                key: 'avg_price',
                label: 'Avg price',
                align: 'right',
                render: (r) => <span className="num">{formatMoney(r.avg_price)}</span>,
              },
              {
                key: 'total_views',
                label: 'Views',
                align: 'right',
                render: (r) => <span className="num">{formatNumber(r.total_views)}</span>,
              },
            ]}
          />
        </Card>
      </div>

      <Card
        className="flush"
        title="Search intelligence"
        subtitle="What people are actually looking for - zero-result searches are unmet demand"
      >
        {searches.data?.data?.length === 0 ? (
          <EmptyState title="No searches recorded" message="search_history is empty." />
        ) : (
          <DataTable
            rows={searches.data?.data}
            loading={searches.isLoading}
            error={searches.error}
            onRetry={searches.refetch}
            rowKey={(row) => row.query}
            columns={[
              { key: 'query', label: 'Query' },
              {
                key: 'searches',
                label: 'Searches',
                align: 'right',
                render: (r) => <span className="num">{formatNumber(r.searches)}</span>,
              },
              {
                key: 'avg_results',
                label: 'Avg results',
                align: 'right',
                render: (r) => <span className="num">{Number(r.avg_results).toFixed(1)}</span>,
              },
              {
                key: 'zero_results',
                label: 'Zero results',
                align: 'right',
                render: (r) => (
                  <span className={Number(r.zero_results) > 0 ? 'num neg' : 'num'}>
                    {formatNumber(r.zero_results)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
};

export default Analytics;
