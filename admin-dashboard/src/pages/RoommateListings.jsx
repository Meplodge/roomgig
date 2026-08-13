import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import PageHeader, { ExportButton } from '../components/PageHeader';
import {
  Card,
  DataTable,
  KeyValue,
  Modal,
  Pagination,
  SearchInput,
  StatusBadge,
} from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePagedQuery, useAction } from '../hooks/usePagedQuery';
import { downloadCsv, formatDate, formatMoney, formatNumber, titleCase } from '../lib/format';

const LIFESTYLE_FIELDS = [
  'sleep_schedule',
  'work_schedule',
  'dietary_preference',
  'social_style',
  'cleanliness_level',
  'guest_policy',
  'noise_tolerance',
  'cooking_habits',
  'alcohol_consumption',
  'work_environment',
];

const DetailModal = ({ id, onClose, onChanged }) => {
  const toast = useToast();
  const { can } = useAuth();
  const query = useQuery({
    queryKey: ['roommate-listing', id],
    queryFn: () => api.get(`/api/roommate-listings/${id}`),
  });
  const { busy, run } = useAction(toast, async () => {
    await query.refetch();
    onChanged?.();
  });

  const listing = query.data?.data;

  return (
    <Modal
      title={listing?.title || 'Roommate listing'}
      onClose={onClose}
      wide
      actions={
        listing && can('super_admin', 'admin', 'moderator') ? (
          <button
            type="button"
            className={`btn ${listing.is_active ? 'btn-danger' : 'btn-primary'}`}
            disabled={busy}
            onClick={() =>
              run(
                () => api.patch(`/api/roommate-listings/${id}`, { is_active: !listing.is_active }),
                listing.is_active ? 'Listing deactivated' : 'Listing reactivated'
              )
            }
          >
            {listing.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
        ) : null
      }
    >
      {query.isLoading || !listing ? (
        <span className="muted">Loading...</span>
      ) : (
        <div className="stack">
          {listing.roommate_images?.length > 0 && (
            <div className="row" style={{ gap: 8, overflowX: 'auto' }}>
              {listing.roommate_images.map((image) => (
                <img
                  key={image.id}
                  src={image.image_url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: 108,
                    height: 84,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}

          {listing.description && <p className="muted">{listing.description}</p>}

          <KeyValue
            items={[
              { label: 'Status', value: <StatusBadge status={listing.is_active ? 'active' : 'inactive'} /> },
              { label: 'Poster', value: listing.profiles?.full_name },
              { label: 'Age', value: listing.age },
              { label: 'Occupation', value: listing.occupation },
              { label: 'City', value: [listing.city, listing.state].filter(Boolean).join(', ') },
              { label: 'Address', value: listing.address },
              {
                label: 'Budget',
                value: `${formatMoney(listing.budget_min)} - ${formatMoney(listing.budget_max)}`,
              },
              { label: 'Move in', value: listing.move_in_date ? formatDate(listing.move_in_date) : null },
              { label: 'Lease', value: listing.lease_duration_months ? `${listing.lease_duration_months} months` : null },
              { label: 'Age range', value: listing.age_min ? `${listing.age_min} - ${listing.age_max}` : null },
              { label: 'Gender pref.', value: titleCase(listing.gender_preference) },
              { label: 'Smoking', value: titleCase(listing.smoking_preference) },
              { label: 'Pets', value: titleCase(listing.pet_preference) },
              { label: 'Languages', value: listing.languages?.join(', ') },
              { label: 'Allergies', value: listing.dietary_allergies },
            ]}
          />

          <div className="col" style={{ gap: 6 }}>
            <span className="micro-label">Lifestyle</span>
            <div className="tag-list">
              {LIFESTYLE_FIELDS.filter((field) => listing[field]).map((field) => (
                <span className="tag" key={field}>
                  {titleCase(field)}: {titleCase(listing[field])}
                </span>
              ))}
            </div>
          </div>

          {listing.preferences?.length > 0 && (
            <div className="col" style={{ gap: 6 }}>
              <span className="micro-label">Preferences</span>
              <div className="tag-list">
                {listing.preferences.map((pref) => (
                  <span className="tag" key={pref}>
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.amenities?.length > 0 && (
            <div className="col" style={{ gap: 6 }}>
              <span className="micro-label">Amenities</span>
              <div className="tag-list">
                {listing.amenities.map((amenity) => (
                  <span className="tag" key={amenity}>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.moderation_note && (
            <div className="col" style={{ gap: 4 }}>
              <span className="micro-label">Moderation note</span>
              <span className="tiny">{listing.moderation_note}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const RoommateListings = () => {
  const [selected, setSelected] = useState(null);
  const list = usePagedQuery('roommate-listings', '/api/roommate-listings', {
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
              <UserRound size={15} />
            </span>
          )}
          <div className="col" style={{ minWidth: 0 }}>
            <span className="cell-title">{row.title}</span>
            <span className="cell-sub">
              {row.profiles?.full_name || 'Unknown'}
              {row.age ? `, ${row.age}` : ''} {row.occupation ? `- ${row.occupation}` : ''}
            </span>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City', render: (row) => row.city || <span className="muted">--</span> },
    {
      key: 'budget',
      label: 'Budget',
      align: 'right',
      render: (row) => (
        <span className="num tiny">
          {formatMoney(row.budget_min)} - {formatMoney(row.budget_max)}
        </span>
      ),
    },
    {
      key: 'gender_preference',
      label: 'Prefers',
      render: (row) => <span className="tiny">{titleCase(row.gender_preference)}</span>,
    },
    {
      key: 'move_in_date',
      label: 'Move in',
      render: (row) => (row.move_in_date ? formatDate(row.move_in_date) : <span className="muted">--</span>),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'created_at',
      label: 'Posted',
      sortable: true,
      align: 'right',
      render: (row) => <span className="tiny muted">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Roommate Listings"
        subtitle={`${formatNumber(list.total)} listings`}
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-roommate-listings.csv',
                list.rows.map((r) => ({
                  id: r.id,
                  title: r.title,
                  poster: r.profiles?.full_name,
                  city: r.city,
                  age: r.age,
                  occupation: r.occupation,
                  budget_min: r.budget_min,
                  budget_max: r.budget_max,
                  active: r.is_active,
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
            placeholder="Title, city or occupation"
          />
          <select
            className="select"
            value={list.filters.active || ''}
            onChange={(e) => list.setFilter('active', e.target.value)}
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className="select"
            value={list.filters.genderPreference || ''}
            onChange={(e) => list.setFilter('genderPreference', e.target.value)}
          >
            <option value="">Any gender pref.</option>
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
          </select>
          <select
            className="select"
            value={list.filters.petPreference || ''}
            onChange={(e) => list.setFilter('petPreference', e.target.value)}
          >
            <option value="">Any pet pref.</option>
            <option value="any">Any</option>
            <option value="pets_allowed">Pets allowed</option>
            <option value="no_pets">No pets</option>
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
          emptyTitle="No roommate listings match those filters"
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
        <DetailModal
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => list.query.refetch()}
        />
      )}
    </>
  );
};

export default RoommateListings;
