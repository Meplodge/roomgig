import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarCheck,
  Eye,
  MousePointerClick,
  ShieldAlert,
  Store,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader, { ExportButton } from '../components/PageHeader';
import {
  Avatar,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
  StatusBadge,
  Stars,
} from '../components/ui';
import { Gauge, SegmentBar, TrendChart, WeekdayBars } from '../components/charts';
import { api } from '../lib/api';
import { useRange } from '../context/RangeContext';
import {
  delta,
  downloadCsv,
  formatCompact,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatRelative,
} from '../lib/format';

const Overview = () => {
  const { from, to, bucket, label } = useRange();
  const navigate = useNavigate();
  const rangeKey = [from, to, bucket];

  const kpis = useQuery({
    queryKey: ['kpis', ...rangeKey],
    queryFn: () => api.get('/api/analytics/kpis', { from, to }),
  });

  const revenueTrend = useQuery({
    queryKey: ['trend', 'revenue', ...rangeKey],
    queryFn: () => api.get('/api/analytics/timeseries/compare', { metric: 'revenue', bucket, from, to }),
  });

  const weekday = useQuery({
    queryKey: ['weekday', ...rangeKey],
    queryFn: () => api.get('/api/analytics/views-by-weekday', { from, to }),
  });

  const topListings = useQuery({
    queryKey: ['top-listings'],
    queryFn: () => api.get('/api/analytics/top-listings', { limit: 6 }),
  });

  const queue = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: () => api.get('/api/properties/moderation-queue'),
  });

  const recentUsers = useQuery({
    queryKey: ['recent-users'],
    queryFn: () => api.get('/api/users', { pageSize: 6, sort: 'created_at', dir: 'desc' }),
  });

  const recentBookings = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: () => api.get('/api/bookings', { pageSize: 6 }),
  });

  const k = kpis.data?.data || {};
  const loading = kpis.isLoading;

  const completionRate = k.total_bookings
    ? (k.bookings_completed / k.total_bookings) * 100
    : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Platform overview - ${label.toLowerCase()}`}
        showRange
        actions={
          <ExportButton
            disabled={!kpis.data}
            onExport={() => downloadCsv('roomgig-kpis.csv', [k])}
          />
        }
      />

      {kpis.isError ? (
        <Card>
          <ErrorState error={kpis.error} onRetry={kpis.refetch} />
        </Card>
      ) : (
        <>
          {/* Row 1 - KPI tiles */}
          <div className="stat-grid">
            <StatCard
              label="Listing Views"
              value={formatCompact(k.views_in_range)}
              icon={Eye}
              delta={delta(k.views_in_range, k.views_prev)}
              caption={`vs. ${formatCompact(k.views_prev)} last period`}
              loading={loading}
            />
            <StatCard
              label="Active Users"
              value={formatCompact(k.active_users)}
              icon={Users}
              delta={delta(k.new_users, k.new_users_prev)}
              caption={`${formatNumber(k.new_users)} new signups`}
              loading={loading}
            />
            <StatCard
              label="Bookings"
              value={formatNumber(k.bookings_in_range)}
              icon={CalendarCheck}
              delta={delta(k.bookings_in_range, k.bookings_prev)}
              caption={`vs. ${formatNumber(k.bookings_prev)} last period`}
              loading={loading}
            />
            <StatCard
              label="Gross Booking Value"
              value={formatMoneyCompact(k.gross_booking_value)}
              icon={Wallet}
              delta={delta(k.gross_booking_value, k.gross_booking_value_prev)}
              caption={`${formatMoneyCompact(k.payments_collected)} collected`}
              loading={loading}
            />
          </div>

          {/* Row 2 - trend + right rail */}
          <div className="grid-2">
            <div className="stack">
              <Card
                title="Gross Booking Value"
                subtitle="From bookings.total_amount - dashed line is the previous period"
              >
                <div className="trend-layout">
                  <div className="col" style={{ gap: 6 }}>
                    <span className="trend-value">
                      {revenueTrend.isLoading ? (
                        <Skeleton height={36} width={140} />
                      ) : (
                        formatMoney(
                          (revenueTrend.data?.data || []).reduce((sum, d) => sum + Number(d.value), 0)
                        )
                      )}
                    </span>
                    <span className="tiny muted">{label}</span>
                  </div>
                  <TrendChart
                    data={revenueTrend.data?.data}
                    bucket={bucket}
                    height={190}
                    valueFormatter={(v) => formatMoney(v)}
                  />
                </div>

                <SegmentBar
                  title="Community"
                  segments={[
                    { label: 'Total users', value: k.total_users, icon: UserRound },
                    { label: 'Hosts', value: k.hosts, icon: Store },
                    { label: 'Suspended', value: k.suspended_users, icon: ShieldAlert },
                  ]}
                />
              </Card>

              <Card
                title="Top Performing Listings"
                subtitle="Ranked by lifetime views"
                actions={
                  <button type="button" className="btn btn-sm" onClick={() => navigate('/properties')}>
                    View all
                  </button>
                }
              >
                <DataTable
                  loading={topListings.isLoading}
                  error={topListings.error}
                  onRetry={topListings.refetch}
                  rows={topListings.data?.data}
                  onRowClick={(row) => navigate(`/properties/${row.id}`)}
                  emptyTitle="No listings yet"
                  columns={[
                    {
                      key: 'title',
                      label: 'Listing',
                      render: (row) => (
                        <div className="cell-media">
                          {row.image_url ? (
                            <img className="thumb" src={row.image_url} alt="" loading="lazy" />
                          ) : (
                            <span className="thumb placeholder">
                              <Building2 size={15} />
                            </span>
                          )}
                          <div className="col" style={{ minWidth: 0 }}>
                            <span className="cell-title">{row.title}</span>
                            <span className="cell-sub">
                              {row.city || 'Unknown'} - {row.host_name || 'Unknown host'}
                            </span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'view_count',
                      label: 'Views',
                      align: 'right',
                      render: (row) => <span className="num">{formatNumber(row.view_count)}</span>,
                    },
                    {
                      key: 'revenue',
                      label: 'Revenue',
                      align: 'right',
                      render: (row) => (
                        <span className="num" style={{ color: 'var(--success)', fontWeight: 600 }}>
                          {formatMoney(row.revenue)}
                        </span>
                      ),
                    },
                    {
                      key: 'rating_avg',
                      label: 'Rating',
                      align: 'right',
                      render: (row) => <Stars rating={row.rating_avg} count={row.review_count} />,
                    },
                  ]}
                />
              </Card>
            </div>

            <div className="stack">
              <Card title="Busiest Day" subtitle="Listing views by weekday">
                {weekday.isLoading ? (
                  <Skeleton height={168} />
                ) : (
                  <WeekdayBars data={weekday.data?.data} />
                )}
              </Card>

              <Card title="Booking Completion" subtitle="Completed vs. all bookings">
                <Gauge value={completionRate} target={80} />
                <button type="button" className="btn btn-block" onClick={() => navigate('/bookings')}>
                  Show details
                </button>
              </Card>

              <Card
                title="Moderation Queue"
                subtitle="Listings that need a human look"
                actions={
                  <span className="badge badge-warning">{formatNumber(queue.data?.count || 0)}</span>
                }
              >
                {queue.isLoading ? (
                  <Skeleton height={120} />
                ) : !queue.data?.data?.length ? (
                  <EmptyState title="Queue is clear" message="Nothing needs attention." />
                ) : (
                  <div className="list-rows">
                    {queue.data.data.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="list-row"
                        style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => navigate(`/properties/${item.id}`)}
                      >
                        {item.thumbnail ? (
                          <img className="thumb" src={item.thumbnail} alt="" loading="lazy" />
                        ) : (
                          <span className="thumb placeholder">
                            <Building2 size={15} />
                          </span>
                        )}
                        <span className="col grow" style={{ minWidth: 0 }}>
                          <span className="cell-title">{item.title}</span>
                          <span className="flag-chip">{item.flags[0]}</span>
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-block"
                      style={{ marginTop: 'var(--space-3)' }}
                      onClick={() => navigate('/moderation')}
                    >
                      Open queue
                    </button>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Row 3 - activity feeds */}
          <div className="grid-halves">
            <Card
              title="Recent Signups"
              actions={
                <button type="button" className="btn btn-sm" onClick={() => navigate('/users')}>
                  View all
                </button>
              }
            >
              {recentUsers.isLoading ? (
                <Skeleton height={140} />
              ) : !recentUsers.data?.data?.length ? (
                <EmptyState title="No users yet" />
              ) : (
                <div className="list-rows">
                  {recentUsers.data.data.map((user) => (
                    <div key={user.id} className="list-row">
                      <Avatar url={user.avatar_url} name={user.full_name} email={user.email} />
                      <div className="col grow" style={{ minWidth: 0 }}>
                        <span className="cell-title">{user.full_name || 'Unnamed user'}</span>
                        <span className="cell-sub">{user.email}</span>
                      </div>
                      <div className="col" style={{ alignItems: 'flex-end' }}>
                        <StatusBadge status={user.is_suspended ? 'suspended' : user.role} />
                        <span className="tiny muted">{formatRelative(user.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              title="Recent Bookings"
              actions={
                <button type="button" className="btn btn-sm" onClick={() => navigate('/bookings')}>
                  View all
                </button>
              }
            >
              {recentBookings.isLoading ? (
                <Skeleton height={140} />
              ) : !recentBookings.data?.data?.length ? (
                <EmptyState title="No bookings yet" icon={MousePointerClick} />
              ) : (
                <div className="list-rows">
                  {recentBookings.data.data.map((booking) => (
                    <div key={booking.id} className="list-row">
                      <div className="col grow" style={{ minWidth: 0 }}>
                        <span className="cell-title mono">{booking.reference}</span>
                        <span className="cell-sub">
                          {booking.properties?.title ||
                            booking.roommate_listings?.title ||
                            'Deleted listing'}
                        </span>
                      </div>
                      <div className="col" style={{ alignItems: 'flex-end' }}>
                        <span className="num" style={{ fontWeight: 600 }}>
                          {formatMoney(booking.total_amount)}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Secondary counters */}
          <div className="grid-thirds">
            <Card className="tight" title="Listings">
              <dl className="kv">
                <dt>Active</dt>
                <dd className="num">{formatNumber(k.active_listings)}</dd>
                <dt>Pending</dt>
                <dd className="num">{formatNumber(k.pending_listings)}</dd>
                <dt>Inactive</dt>
                <dd className="num">{formatNumber(k.inactive_listings)}</dd>
                <dt>Removed</dt>
                <dd className="num">{formatNumber(k.deleted_listings)}</dd>
                <dt>Roommate ads</dt>
                <dd className="num">{formatNumber(k.active_roommate_listings)}</dd>
              </dl>
            </Card>

            <Card className="tight" title="Engagement">
              <dl className="kv">
                <dt>Total views</dt>
                <dd className="num">{formatNumber(k.total_views)}</dd>
                <dt>Favorites</dt>
                <dd className="num">{formatNumber(k.total_favorites)}</dd>
                <dt>Inquiries</dt>
                <dd className="num">{formatNumber(k.total_inquiries)}</dd>
                <dt>Messages</dt>
                <dd className="num">{formatNumber(k.messages_in_range)}</dd>
                <dt>Searches</dt>
                <dd className="num">{formatNumber(k.searches_in_range)}</dd>
              </dl>
            </Card>

            <Card className="tight" title="Quality">
              <dl className="kv">
                <dt>Avg rating</dt>
                <dd className="num">{Number(k.avg_rating || 0).toFixed(2)}</dd>
                <dt>Reviews</dt>
                <dd className="num">{formatNumber(k.total_reviews)}</dd>
                <dt>Hidden reviews</dt>
                <dd className="num">{formatNumber(k.hidden_reviews)}</dd>
                <dt>Verified users</dt>
                <dd className="num">{formatNumber(k.verified_users)}</dd>
                <dt>Push failures</dt>
                <dd className="num" style={{ color: k.push_failures ? 'var(--error)' : undefined }}>
                  {formatNumber(k.push_failures)}
                </dd>
              </dl>
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default Overview;
