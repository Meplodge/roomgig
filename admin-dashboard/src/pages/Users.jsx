import { useNavigate } from 'react-router-dom';
import PageHeader, { ExportButton } from '../components/PageHeader';
import { Avatar, Card, DataTable, Pagination, SearchInput, StatusBadge } from '../components/ui';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { downloadCsv, formatDate, formatNumber, formatRelative } from '../lib/format';

const Users = () => {
  const navigate = useNavigate();
  const list = usePagedQuery('users', '/api/users', {
    initialSort: { key: 'created_at', dir: 'desc' },
  });

  const columns = [
    {
      key: 'full_name',
      label: 'User',
      sortable: true,
      render: (row) => (
        <div className="cell-media">
          <Avatar url={row.avatar_url} name={row.full_name} email={row.email} />
          <div className="col" style={{ minWidth: 0 }}>
            <span className="cell-title">{row.full_name || 'Unnamed user'}</span>
            <span className="cell-sub">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) =>
        row.is_suspended ? (
          <StatusBadge status="suspended" />
        ) : row.is_verified ? (
          <StatusBadge status="verified" />
        ) : (
          <span className="tiny muted">Unverified</span>
        ),
    },
    { key: 'city', label: 'City', render: (row) => row.city || <span className="muted">--</span> },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => row.phone || <span className="muted">--</span>,
    },
    {
      key: 'listings_count',
      label: 'Listings',
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.listings_count)}</span>,
    },
    {
      key: 'bookings_count',
      label: 'Bookings',
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.bookings_count)}</span>,
    },
    {
      key: 'last_seen_at',
      label: 'Last seen',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatRelative(row.last_seen_at)}</span>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${formatNumber(list.total)} registered accounts`}
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-users.csv',
                list.rows.map((r) => ({
                  id: r.id,
                  name: r.full_name,
                  email: r.email,
                  phone: r.phone,
                  role: r.role,
                  verified: r.is_verified,
                  suspended: r.is_suspended,
                  city: r.city,
                  listings: r.listings_count,
                  bookings: r.bookings_count,
                  joined: r.created_at,
                }))
              )
            }
          />
        }
      />

      <Card className="flush">
        <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
          <SearchInput
            value={list.filters.q || ''}
            onChange={(value) => list.setFilter('q', value)}
            placeholder="Name, email, phone or city"
          />
          <select
            className="select"
            value={list.filters.role || ''}
            onChange={(e) => list.setFilter('role', e.target.value)}
          >
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="host">Host</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="select"
            value={list.filters.suspended || ''}
            onChange={(e) => list.setFilter('suspended', e.target.value)}
          >
            <option value="">Any status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
          <select
            className="select"
            value={list.filters.verified || ''}
            onChange={(e) => list.setFilter('verified', e.target.value)}
          >
            <option value="">Any verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
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
          onRowClick={(row) => navigate(`/users/${row.id}`)}
          sort={list.sort}
          onSortChange={list.setSort}
          emptyTitle="No users match those filters"
        />

        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
        />
      </Card>
    </>
  );
};

export default Users;
