import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Check, RotateCcw, Star, Trash2, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  KeyValue,
  Skeleton,
  StatusBadge,
  Stars,
} from '../components/ui';
import { TrendChart } from '../components/charts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelative,
  titleCase,
} from '../lib/format';

/** Buckets raw view timestamps into a daily series for the chart. */
const dailySeries = (views) => {
  const counts = new Map();
  for (const view of views || []) {
    const day = new Date(view.viewed_at);
    if (Number.isNaN(day.getTime())) continue;
    const key = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())).toISOString();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([bucket, value]) => ({ bucket, value }));
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [dialog, setDialog] = useState(null);

  const query = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/api/properties/${id}`),
  });

  const { busy, run } = useAction(toast, () => query.refetch());

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Listing" />
        <Card>
          <Skeleton height={160} />
        </Card>
      </>
    );
  }

  if (query.isError) {
    return (
      <>
        <PageHeader title="Listing" />
        <Card>
          <ErrorState error={query.error} onRetry={query.refetch} />
        </Card>
      </>
    );
  }

  const { property, bookings, reviews, views } = query.data.data;
  const images = property.property_images || [];
  const facilities = (property.property_facilities || []).map((f) => f.facilities).filter(Boolean);
  const canModerate = can('super_admin', 'admin', 'moderator');
  const closeDialog = () => setDialog(null);

  return (
    <>
      <PageHeader
        title={property.title}
        subtitle={[property.address, property.city, property.state].filter(Boolean).join(', ')}
        actions={
          <>
            <button type="button" className="btn" onClick={() => navigate('/properties')}>
              <ArrowLeft size={15} /> Back
            </button>
            {canModerate && property.status !== 'active' && !property.deleted_at && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(
                    () => api.post(`/api/properties/${id}/moderate`, { decision: 'approve' }),
                    'Listing approved'
                  )
                }
              >
                <Check size={15} /> Approve
              </button>
            )}
            {canModerate && property.status === 'active' && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setDialog('reject')}
              >
                <X size={15} /> Reject
              </button>
            )}
            {canModerate && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(
                    () => api.patch(`/api/properties/${id}`, { is_featured: !property.is_featured }),
                    property.is_featured ? 'Removed from featured' : 'Listing featured'
                  )
                }
              >
                <Star size={15} fill={property.is_featured ? 'var(--star)' : 'none'} />
                {property.is_featured ? 'Unfeature' : 'Feature'}
              </button>
            )}
            {can('super_admin', 'admin') &&
              (property.deleted_at ? (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => run(() => api.post(`/api/properties/${id}/restore`, {}), 'Listing restored')}
                >
                  <RotateCcw size={15} /> Restore
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => setDialog('remove')}
                >
                  <Trash2 size={15} /> Remove
                </button>
              ))}
          </>
        }
      />

      {property.moderation_note && (
        <Card className="tight">
          <div className="col">
            <span className="micro-label">Moderation note</span>
            <span>{property.moderation_note}</span>
            <span className="tiny muted">{formatRelative(property.moderated_at)}</span>
          </div>
        </Card>
      )}

      <div className="grid-2">
        <div className="stack">
          <Card title="Images" subtitle={`${images.length} uploaded`}>
            {images.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 'var(--space-3)',
                }}
              >
                {images
                  .slice()
                  .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                  .map((image) => (
                    <img
                      key={image.id}
                      src={image.image_url}
                      alt={image.alt_text || ''}
                      loading="lazy"
                      style={{
                        width: '100%',
                        aspectRatio: '4 / 3',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius)',
                        border: image.is_primary ? '2px solid var(--primary)' : '1px solid var(--border)',
                      }}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState title="No images" message="This listing has no photos." icon={Building2} />
            )}
          </Card>

          <Card title="Details">
            <KeyValue
              items={[
                { label: 'Status', value: <StatusBadge status={property.deleted_at ? 'deleted' : property.status} /> },
                { label: 'Type', value: titleCase(property.type) },
                { label: 'Category', value: titleCase(property.category) },
                { label: 'Price', value: formatMoney(property.price) },
                { label: 'Bedrooms', value: property.bedrooms },
                { label: 'Bathrooms', value: property.bathrooms },
                { label: 'Square feet', value: property.square_feet ? formatNumber(property.square_feet) : null },
                { label: 'Year built', value: property.year_built },
                { label: 'Address', value: property.address },
                { label: 'Postal code', value: property.postal_code },
                {
                  label: 'Coordinates',
                  value:
                    property.latitude && property.longitude
                      ? `${property.latitude}, ${property.longitude}`
                      : null,
                },
                { label: 'Listed', value: formatDateTime(property.listed_at) },
                { label: 'Expires', value: property.expires_at ? formatDateTime(property.expires_at) : null },
                { label: 'Listing ID', value: <span className="mono">{property.id}</span> },
              ]}
            />
            {property.description && (
              <div className="col" style={{ gap: 4 }}>
                <span className="micro-label">Description</span>
                <p className="muted">{property.description}</p>
              </div>
            )}
            {facilities.length > 0 && (
              <div className="col" style={{ gap: 6 }}>
                <span className="micro-label">Amenities</span>
                <div className="tag-list">
                  {facilities.map((facility) => (
                    <span className="tag" key={facility.id}>
                      {facility.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Views over time" subtitle={`${formatNumber(views.length)} recorded views`}>
            <TrendChart data={dailySeries(views)} bucket="day" height={180} showPrevious={false} />
          </Card>
        </div>

        <div className="stack">
          <Card className="tight" title="Performance">
            <KeyValue
              items={[
                { label: 'Views', value: formatNumber(property.view_count) },
                { label: 'Favorites', value: formatNumber(property.favorite_count) },
                { label: 'Inquiries', value: formatNumber(property.inquiry_count) },
                { label: 'Rating', value: <Stars rating={property.rating_avg} count={property.review_count} /> },
                { label: 'Bookings', value: formatNumber(bookings.length) },
                { label: 'Featured', value: property.is_featured ? 'Yes' : 'No' },
              ]}
            />
          </Card>

          <Card className="tight" title="Host">
            {property.profiles ? (
              <>
                <KeyValue
                  items={[
                    {
                      label: 'Name',
                      value: (
                        <Link to={`/users/${property.profiles.id}`} style={{ color: 'var(--primary)' }}>
                          {property.profiles.full_name || 'Unnamed'}
                        </Link>
                      ),
                    },
                    { label: 'Email', value: property.profiles.email || property.host_email },
                    { label: 'Phone', value: property.profiles.phone || property.host_phone },
                    { label: 'Verified', value: property.profiles.is_verified ? 'Yes' : 'No' },
                  ]}
                />
                {property.profiles.is_suspended && (
                  <span className="badge badge-error">Host is suspended</span>
                )}
              </>
            ) : (
              <span className="tiny muted">Host account no longer exists.</span>
            )}
          </Card>
        </div>
      </div>

      <Card title="Bookings" className="flush">
        <DataTable
          rows={bookings}
          emptyTitle="No bookings for this listing"
          columns={[
            { key: 'reference', label: 'Reference', render: (r) => <span className="mono">{r.reference}</span> },
            { key: 'guest', label: 'Guest', render: (r) => r.profiles?.full_name || 'Unknown' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'check_in_date', label: 'Check in', render: (r) => formatDate(r.check_in_date) },
            { key: 'check_out_date', label: 'Check out', render: (r) => formatDate(r.check_out_date) },
            { key: 'total_amount', label: 'Amount', align: 'right', render: (r) => formatMoney(r.total_amount) },
          ]}
        />
      </Card>

      <Card title="Reviews" className="flush">
        <DataTable
          rows={reviews}
          emptyTitle="No reviews yet"
          columns={[
            { key: 'rating', label: 'Rating', render: (r) => <Stars rating={r.rating} /> },
            { key: 'author', label: 'Author', render: (r) => r.profiles?.full_name || 'Unknown' },
            {
              key: 'content',
              label: 'Review',
              render: (r) => (
                <div className="col">
                  {r.title && <span className="cell-title">{r.title}</span>}
                  <span className="cell-sub">{r.content}</span>
                </div>
              ),
            },
            {
              key: 'is_visible',
              label: 'Visible',
              render: (r) => (
                <StatusBadge
                  status={r.is_visible ? 'active' : 'inactive'}
                  label={r.is_visible ? 'Visible' : 'Hidden'}
                />
              ),
            },
            { key: 'created_at', label: 'When', align: 'right', render: (r) => formatDate(r.created_at) },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (r) =>
                canModerate ? (
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => api.patch(`/api/reviews/${r.id}`, { is_visible: !r.is_visible }),
                        r.is_visible ? 'Review hidden' : 'Review restored'
                      )
                    }
                  >
                    {r.is_visible ? 'Hide' : 'Show'}
                  </button>
                ) : null,
            },
          ]}
        />
      </Card>

      {dialog === 'reject' && (
        <ConfirmDialog
          title="Reject this listing?"
          message="It will be set to inactive and disappear from the mobile app. The host keeps the record."
          confirmLabel="Reject listing"
          danger
          requireReason
          busy={busy}
          onClose={closeDialog}
          onConfirm={async (reason) => {
            await run(
              () => api.post(`/api/properties/${id}/moderate`, { decision: 'reject', reason }),
              'Listing rejected'
            );
            closeDialog();
          }}
        />
      )}

      {dialog === 'remove' && (
        <ConfirmDialog
          title="Remove this listing?"
          message="This is a soft delete: the listing is hidden everywhere but the record and its bookings are preserved, and you can restore it later."
          confirmLabel="Remove listing"
          danger
          requireReason
          busy={busy}
          onClose={closeDialog}
          onConfirm={async (reason) => {
            await run(() => api.del(`/api/properties/${id}`, { reason }), 'Listing removed');
            closeDialog();
          }}
        />
      )}
    </>
  );
};

export default PropertyDetail;
