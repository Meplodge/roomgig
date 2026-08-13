import { useNavigate } from 'react-router-dom';
import { Building2, Star } from 'lucide-react';
import PageHeader, { ExportButton } from '../components/PageHeader';
import { Card, DataTable, Pagination, SearchInput, StatusBadge, Stars } from '../components/ui';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { downloadCsv, formatDate, formatMoney, formatNumber, titleCase } from '../lib/format';

const CATEGORIES = ['apartment', 'villa', 'house', 'duplex', 'studio', 'condo', 'townhouse'];
const STATUSES = ['active', 'pending', 'inactive', 'sold', 'rented', 'deleted'];

const Properties = () => {
  const navigate = useNavigate();
  const list = usePagedQuery('properties', '/api/properties', {
    initialSort: { key: 'created_at', dir: 'desc' },
  });

  const columns = [
    {
      key: 'title',
      label: 'Listing',
      sortable: true,
      render: (row) => (
        <div className="cell-media">
          {row.thumbnail ? (
            <img className="thumb" src={row.thumbnail} alt="" loading="lazy" />
          ) : (
            <span className="thumb placeholder">
              <Building2 size={15} />
            </span>
          )}
          <div className="col" style={{ minWidth: 0 }}>
            <span className="cell-title">
              {row.is_featured && <Star size={11} fill="var(--star)" stroke="none" />} {row.title}
            </span>
            <span className="cell-sub">
              {titleCase(row.category)} - {row.city || 'Unknown city'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'host',
      label: 'Host',
      render: (row) => (
        <div className="col" style={{ minWidth: 0 }}>
          <span className="truncate">{row.profiles?.full_name || row.host_name || 'Unknown'}</span>
          {row.profiles?.is_suspended && <span className="tiny neg">Suspended</span>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.deleted_at ? 'deleted' : row.status} />,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      render: (row) => <span className="num">{formatMoney(row.price)}</span>,
    },
    {
      key: 'view_count',
      label: 'Views',
      sortable: true,
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.view_count)}</span>,
    },
    {
      key: 'favorite_count',
      label: 'Saves',
      sortable: true,
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.favorite_count)}</span>,
    },
    {
      key: 'rating_avg',
      label: 'Rating',
      sortable: true,
      align: 'right',
      render: (row) =>
        row.review_count ? (
          <Stars rating={row.rating_avg} count={row.review_count} />
        ) : (
          <span className="muted tiny">No reviews</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Listed',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle={`${formatNumber(list.total)} listings`}
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-properties.csv',
                list.rows.map((r) => ({
                  id: r.id,
                  title: r.title,
                  host: r.profiles?.full_name || r.host_name,
                  status: r.status,
                  type: r.type,
                  category: r.category,
                  price: r.price,
                  city: r.city,
                  views: r.view_count,
                  favorites: r.favorite_count,
                  inquiries: r.inquiry_count,
                  rating: r.rating_avg,
                  featured: r.is_featured,
                  created: r.created_at,
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
            placeholder="Title, address or city"
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
            value={list.filters.category || ''}
            onChange={(e) => list.setFilter('category', e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {titleCase(category)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={list.filters.type || ''}
            onChange={(e) => list.setFilter('type', e.target.value)}
          >
            <option value="">All types</option>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
            <option value="buy">Buy</option>
          </select>
          <input
            className="input"
            style={{ width: 110 }}
            type="number"
            placeholder="Min price"
            value={list.filters.minPrice || ''}
            onChange={(e) => list.setFilter('minPrice', e.target.value)}
          />
          <input
            className="input"
            style={{ width: 110 }}
            type="number"
            placeholder="Max price"
            value={list.filters.maxPrice || ''}
            onChange={(e) => list.setFilter('maxPrice', e.target.value)}
          />
          <label className="row tiny" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={list.filters.featured === 'true'}
              onChange={(e) => list.setFilter('featured', e.target.checked ? 'true' : '')}
            />
            Featured only
          </label>
          <label className="row tiny" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={list.filters.includeDeleted === 'true'}
              onChange={(e) => list.setFilter('includeDeleted', e.target.checked ? 'true' : '')}
            />
            Include removed
          </label>
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
          onRowClick={(row) => navigate(`/properties/${row.id}`)}
          sort={list.sort}
          onSortChange={list.setSort}
          emptyTitle="No listings match those filters"
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

export default Properties;
