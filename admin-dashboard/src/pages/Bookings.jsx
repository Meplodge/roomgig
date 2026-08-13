import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader, { ExportButton } from '../components/PageHeader';
import {
  Card,
  ConfirmDialog,
  DataTable,
  KeyValue,
  Modal,
  Pagination,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRange } from '../context/RangeContext';
import { useToast } from '../context/ToastContext';
import { usePagedQuery, useAction } from '../hooks/usePagedQuery';
import {
  downloadCsv,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  titleCase,
} from '../lib/format';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'expired'];

const BookingModal = ({ id, onClose, onChanged }) => {
  const toast = useToast();
  const { can } = useAuth();
  const [pendingStatus, setPendingStatus] = useState(null);

  const query = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get(`/api/bookings/${id}`),
  });
  const { busy, run } = useAction(toast, async () => {
    await query.refetch();
    onChanged?.();
  });

  const booking = query.data?.data?.booking;
  const payments = query.data?.data?.payments || [];

  return (
    <>
      <Modal title={booking ? `Booking ${booking.reference}` : 'Booking'} onClose={onClose} wide>
        {query.isLoading || !booking ? (
          <span className="muted">Loading...</span>
        ) : (
          <div className="stack">
            <KeyValue
              items={[
                { label: 'Status', value: <StatusBadge status={booking.status} /> },
                {
                  label: 'Guest',
                  value: booking.profiles ? (
                    <Link to={`/users/${booking.profiles.id}`} style={{ color: 'var(--primary)' }}>
                      {booking.profiles.full_name || booking.profiles.email}
                    </Link>
                  ) : (
                    'Deleted user'
                  ),
                },
                {
                  label: 'Listing',
                  value: booking.properties ? (
                    <Link to={`/properties/${booking.properties.id}`} style={{ color: 'var(--primary)' }}>
                      {booking.properties.title}
                    </Link>
                  ) : (
                    booking.roommate_listings?.title || 'Deleted listing'
                  ),
                },
                { label: 'Check in', value: formatDate(booking.check_in_date) },
                { label: 'Check out', value: formatDate(booking.check_out_date) },
                { label: 'Guests', value: booking.guests },
                { label: 'Total', value: formatMoney(booking.total_amount) },
                { label: 'Special requests', value: booking.special_requests },
                { label: 'Created', value: formatDateTime(booking.created_at) },
                { label: 'Confirmed', value: booking.confirmed_at ? formatDateTime(booking.confirmed_at) : null },
                { label: 'Cancelled', value: booking.cancelled_at ? formatDateTime(booking.cancelled_at) : null },
                { label: 'Completed', value: booking.completed_at ? formatDateTime(booking.completed_at) : null },
              ]}
            />

            <div className="col" style={{ gap: 6 }}>
              <span className="micro-label">Payments</span>
              {payments.length ? (
                payments.map((payment) => (
                  <div className="row-between tiny" key={payment.id}>
                    <span className="mono">{payment.transaction_id || payment.id.slice(0, 8)}</span>
                    <span>{formatMoney(payment.amount, payment.currency)}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                ))
              ) : (
                <span className="tiny muted">No payment records.</span>
              )}
            </div>

            {can('super_admin', 'admin') && (
              <div className="col" style={{ gap: 6 }}>
                <span className="micro-label">Change status</span>
                <p className="tiny muted">
                  Changing the status sends the guest an in-app notification automatically.
                </p>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {STATUSES.filter((s) => s !== booking.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() => setPendingStatus(status)}
                    >
                      {titleCase(status)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {pendingStatus && (
        <ConfirmDialog
          title={`Mark booking as ${pendingStatus}?`}
          message="The guest will receive a notification about this change."
          confirmLabel={`Set ${pendingStatus}`}
          danger={pendingStatus === 'cancelled'}
          requireReason
          busy={busy}
          onClose={() => setPendingStatus(null)}
          onConfirm={async (reason) => {
            await run(
              () => api.patch(`/api/bookings/${id}`, { status: pendingStatus, reason }),
              'Booking updated'
            );
            setPendingStatus(null);
          }}
        />
      )}
    </>
  );
};

const Bookings = () => {
  const { from, to } = useRange();
  const [selected, setSelected] = useState(null);
  const list = usePagedQuery('bookings', '/api/bookings', {
    initialSort: { key: 'created_at', dir: 'desc' },
  });

  const summary = useQuery({
    queryKey: ['bookings-summary', from, to],
    queryFn: () => api.get('/api/bookings/summary', { from, to }),
  });
  const s = summary.data?.data || {};

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
      render: (row) => <span className="mono">{row.reference}</span>,
    },
    {
      key: 'guest',
      label: 'Guest',
      render: (row) => (
        <div className="col" style={{ minWidth: 0 }}>
          <span className="truncate">{row.profiles?.full_name || 'Deleted user'}</span>
          <span className="cell-sub">{row.profiles?.email}</span>
        </div>
      ),
    },
    {
      key: 'listing',
      label: 'Listing',
      render: (row) => (
        <span className="truncate">
          {row.properties?.title || row.roommate_listings?.title || (
            <span className="muted">Deleted listing</span>
          )}
        </span>
      ),
    },
    {
      key: 'check_in_date',
      label: 'Check in',
      sortable: true,
      render: (row) => formatDate(row.check_in_date),
    },
    { key: 'check_out_date', label: 'Check out', render: (row) => formatDate(row.check_out_date) },
    { key: 'guests', label: 'Guests', align: 'right' },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (row) => <span className="num">{formatMoney(row.total_amount)}</span>,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle={`${formatNumber(list.total)} bookings`}
        showRange
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-bookings.csv',
                list.rows.map((r) => ({
                  reference: r.reference,
                  guest: r.profiles?.full_name,
                  email: r.profiles?.email,
                  listing: r.properties?.title || r.roommate_listings?.title,
                  status: r.status,
                  check_in: r.check_in_date,
                  check_out: r.check_out_date,
                  guests: r.guests,
                  amount: r.total_amount,
                  created: r.created_at,
                }))
              )
            }
          />
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Bookings in range"
          value={formatNumber(s.total)}
          caption={`${formatNumber(s.by_status?.pending)} pending`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Gross value"
          value={formatMoney(s.gross_value)}
          caption={`Avg ${formatMoney(s.average_value)}`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Completion rate"
          value={formatPercent(s.completion_rate)}
          caption={`${formatNumber(s.by_status?.completed)} completed`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Cancellation rate"
          value={formatPercent(s.cancellation_rate)}
          caption={`${formatNumber(s.by_status?.cancelled)} cancelled`}
          loading={summary.isLoading}
        />
      </div>

      <Card className="flush">
        <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
          <SearchInput
            value={list.filters.q || ''}
            onChange={(value) => list.setFilter('q', value)}
            placeholder="Booking reference"
          />
          <select
            className="select"
            value={list.filters.status || ''}
            onChange={(e) => list.setFilter('status', e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={list.filters.dateField || 'created_at'}
            onChange={(e) => list.setFilter('dateField', e.target.value)}
          >
            <option value="created_at">Filter by created</option>
            <option value="check_in_date">Filter by check-in</option>
          </select>
          {Object.keys(list.filters).length > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={list.resetFilters}>
              Clear
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.query.isLoading}
          error={list.query.error}
          onRetry={list.query.refetch}
          onRowClick={(row) => setSelected(row.id)}
          sort={list.sort}
          onSortChange={list.setSort}
          emptyTitle="No bookings match those filters"
        />

        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
        />
      </Card>

      {selected && (
        <BookingModal
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => list.query.refetch()}
        />
      )}
    </>
  );
};

export default Bookings;
