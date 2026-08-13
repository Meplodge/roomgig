import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageHeader, { ExportButton } from '../components/PageHeader';
import { Card, DataTable, Pagination, SearchInput, StatCard, StatusBadge } from '../components/ui';
import { DonutChart } from '../components/charts';
import { api } from '../lib/api';
import { useRange } from '../context/RangeContext';
import { usePagedQuery } from '../hooks/usePagedQuery';
import {
  downloadCsv,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  titleCase,
} from '../lib/format';

const STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const Payments = () => {
  const { from, to } = useRange();
  const list = usePagedQuery('payments', '/api/payments', {
    initialSort: { key: 'created_at', dir: 'desc' },
  });

  const summary = useQuery({
    queryKey: ['payments-summary', from, to],
    queryFn: () => api.get('/api/payments/summary', { from, to }),
  });
  const s = summary.data?.data || {};

  const donutData = STATUSES.map((status) => ({
    label: titleCase(status),
    value: s.by_status?.[status] || 0,
  }));

  const columns = [
    {
      key: 'transaction_id',
      label: 'Transaction',
      render: (row) => <span className="mono">{row.transaction_id || row.id.slice(0, 8)}</span>,
    },
    {
      key: 'user',
      label: 'User',
      render: (row) =>
        row.profiles ? (
          <Link
            to={`/users/${row.profiles.id}`}
            style={{ color: 'var(--primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {row.profiles.full_name || row.profiles.email}
          </Link>
        ) : (
          <span className="muted">Deleted user</span>
        ),
    },
    {
      key: 'booking',
      label: 'Booking',
      render: (row) =>
        row.bookings ? <span className="mono">{row.bookings.reference}</span> : <span className="muted">--</span>,
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) =>
        row.payment_methods ? (
          <span className="tiny">
            {titleCase(row.payment_methods.type)}
            {row.payment_methods.last_four ? ` **** ${row.payment_methods.last_four}` : ''}
          </span>
        ) : (
          <span className="muted tiny">--</span>
        ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (row) => <span className="num">{formatMoney(row.amount, row.currency)}</span>,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDateTime(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={`${formatNumber(list.total)} transactions`}
        showRange
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-payments.csv',
                list.rows.map((r) => ({
                  transaction_id: r.transaction_id,
                  user: r.profiles?.full_name,
                  booking: r.bookings?.reference,
                  amount: r.amount,
                  currency: r.currency,
                  status: r.status,
                  created: r.created_at,
                  completed: r.completed_at,
                }))
              )
            }
          />
        }
      />

      <Card className="tight">
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <AlertTriangle size={15} color="var(--warning)" />
          <span className="tiny muted">
            This app has no payment gateway integration, so this page is report-only. Refunds must be
            issued in your payment provider's own dashboard; the resulting status change flows back
            into this table.
          </span>
        </div>
      </Card>

      <div className="stat-grid">
        <StatCard
          label="Collected"
          value={formatMoney(s.collected)}
          caption={`${formatNumber(s.by_status?.completed)} completed payments`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Pending"
          value={formatMoney(s.amount_by_status?.pending)}
          caption={`${formatNumber(s.by_status?.pending)} awaiting settlement`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Refunded"
          value={formatMoney(s.amount_by_status?.refunded)}
          caption={`${formatNumber(s.by_status?.refunded)} refunds`}
          loading={summary.isLoading}
        />
        <StatCard
          label="Failure rate"
          value={formatPercent(s.failure_rate)}
          caption={`${formatNumber(s.by_status?.failed)} failed attempts`}
          loading={summary.isLoading}
        />
      </div>

      <div className="grid-2">
        <Card className="flush">
          <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
            <SearchInput
              value={list.filters.q || ''}
              onChange={(value) => list.setFilter('q', value)}
              placeholder="Transaction ID"
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
            sort={list.sort}
            onSortChange={list.setSort}
            emptyTitle="No payments match those filters"
          />

          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
          />
        </Card>

        <Card title="Payments by status" subtitle="In the selected range">
          <DonutChart data={donutData} />
        </Card>
      </div>
    </>
  );
};

export default Payments;
