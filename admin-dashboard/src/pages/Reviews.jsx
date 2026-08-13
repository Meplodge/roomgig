import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader, { ExportButton } from '../components/PageHeader';
import {
  Avatar,
  Card,
  ConfirmDialog,
  DataTable,
  Pagination,
  StatusBadge,
  Stars,
} from '../components/ui';
import { RankedBars } from '../components/charts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePagedQuery, useAction } from '../hooks/usePagedQuery';
import { downloadCsv, formatDate, formatNumber } from '../lib/format';

const Reviews = () => {
  const toast = useToast();
  const { can } = useAuth();
  const [deleting, setDeleting] = useState(null);

  const list = usePagedQuery('reviews', '/api/reviews', {
    initialSort: { key: 'created_at', dir: 'desc' },
  });
  const { busy, run } = useAction(toast, () => list.query.refetch());

  const distribution = useQuery({
    queryKey: ['rating-distribution'],
    queryFn: () => api.get('/api/analytics/rating-distribution'),
  });

  const canModerate = can('super_admin', 'admin', 'moderator');

  const columns = [
    {
      key: 'author',
      label: 'Reviewer',
      render: (row) => (
        <div className="cell-media">
          <Avatar url={row.profiles?.avatar_url} name={row.profiles?.full_name} size={28} />
          <div className="col" style={{ minWidth: 0 }}>
            <span className="cell-title">{row.profiles?.full_name || 'Unknown'}</span>
            <span className="cell-sub">{row.profiles?.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'listing',
      label: 'Listing',
      render: (row) =>
        row.properties ? (
          <Link
            to={`/properties/${row.properties.id}`}
            style={{ color: 'var(--primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate">{row.properties.title}</span>
          </Link>
        ) : (
          <span className="muted">--</span>
        ),
    },
    { key: 'rating', label: 'Rating', sortable: true, render: (row) => <Stars rating={row.rating} /> },
    {
      key: 'content',
      label: 'Review',
      render: (row) => (
        <div className="col" style={{ minWidth: 0 }}>
          {row.title && <span className="cell-title">{row.title}</span>}
          <span className="cell-sub">{row.content}</span>
        </div>
      ),
    },
    {
      key: 'is_visible',
      label: 'Visible',
      render: (row) => (
        <StatusBadge
          status={row.is_visible ? 'active' : 'inactive'}
          label={row.is_visible ? 'Visible' : 'Hidden'}
        />
      ),
    },
    {
      key: 'created_at',
      label: 'Posted',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) =>
        canModerate ? (
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() =>
                run(
                  () => api.patch(`/api/reviews/${row.id}`, { is_visible: !row.is_visible }),
                  row.is_visible ? 'Review hidden' : 'Review restored'
                )
              }
            >
              {row.is_visible ? 'Hide' : 'Show'}
            </button>
            {can('super_admin', 'admin') && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={busy}
                onClick={() => setDeleting(row)}
              >
                Delete
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  const distributionRows = (distribution.data?.data || []).map((row) => ({
    label: `${row.rating} star${row.rating === 1 ? '' : 's'}`,
    value: Number(row.value),
  }));

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle={`${formatNumber(list.total)} reviews`}
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-reviews.csv',
                list.rows.map((r) => ({
                  id: r.id,
                  reviewer: r.profiles?.full_name,
                  listing: r.properties?.title,
                  rating: r.rating,
                  title: r.title,
                  content: r.content,
                  visible: r.is_visible,
                  created: r.created_at,
                }))
              )
            }
          />
        }
      />

      <div className="grid-2">
        <Card className="flush">
          <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
            <select
              className="select"
              value={list.filters.rating || ''}
              onChange={(e) => list.setFilter('rating', e.target.value)}
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} star{rating === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={list.filters.visible || ''}
              onChange={(e) => list.setFilter('visible', e.target.value)}
            >
              <option value="">Any visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
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
            emptyTitle="No reviews match those filters"
          />

          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
          />
        </Card>

        <Card title="Rating distribution" subtitle="Visible reviews only">
          <RankedBars data={distributionRows} />
          <p className="tiny muted">
            Hiding a review automatically recalculates the listing's average rating and review count.
          </p>
        </Card>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this review?"
          message="The review is permanently removed and the listing's rating is recalculated. Hiding it is usually the better option."
          confirmLabel="Delete review"
          danger
          requireReason
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={async (reason) => {
            await run(() => api.del(`/api/reviews/${deleting.id}`, { reason }), 'Review deleted');
            setDeleting(null);
          }}
        />
      )}
    </>
  );
};

export default Reviews;
