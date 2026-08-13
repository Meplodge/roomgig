import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCheck, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  Avatar,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  KeyValue,
  Skeleton,
  StatusBadge,
  Stars,
  Tabs,
} from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';
import {
  age,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelative,
  titleCase,
} from '../lib/format';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [tab, setTab] = useState('listings');
  const [dialog, setDialog] = useState(null);

  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/api/users/${id}`),
  });

  const { busy, run } = useAction(toast, () => query.refetch());
  const data = query.data?.data;
  const user = data?.profile;

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="User" />
        <Card>
          <Skeleton height={120} />
        </Card>
      </>
    );
  }

  if (query.isError) {
    return (
      <>
        <PageHeader title="User" />
        <Card>
          <ErrorState error={query.error} onRetry={query.refetch} />
        </Card>
      </>
    );
  }

  const closeDialog = () => setDialog(null);

  const tabs = [
    { id: 'listings', label: 'Listings', count: data.properties.length + data.roommate_listings.length },
    { id: 'bookings', label: 'Bookings', count: data.bookings.length },
    { id: 'payments', label: 'Payments', count: data.payments.length },
    { id: 'activity', label: 'Activity', count: data.searches.length },
    { id: 'reviews', label: 'Reviews', count: data.reviews.length },
    { id: 'devices', label: 'Devices', count: data.devices.length + data.push_tokens.length },
  ];

  return (
    <>
      <PageHeader
        title={user.full_name || 'Unnamed user'}
        subtitle={user.email}
        actions={
          <>
            <button type="button" className="btn" onClick={() => navigate('/users')}>
              <ArrowLeft size={15} /> Back
            </button>
            {can('super_admin', 'admin') && !user.is_verified && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(() => api.patch(`/api/users/${id}`, { is_verified: true }), 'User verified')
                }
              >
                <CheckCheck size={15} /> Verify
              </button>
            )}
            {can('super_admin', 'admin') && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setDialog('signout')}
              >
                <LogOut size={15} /> Force sign-out
              </button>
            )}
            {can('super_admin', 'admin', 'moderator') &&
              (user.is_suspended ? (
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    run(() => api.post(`/api/users/${id}/unsuspend`, {}), 'Suspension lifted')
                  }
                >
                  <ShieldCheck size={15} /> Unsuspend
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => setDialog('suspend')}
                >
                  <Ban size={15} /> Suspend
                </button>
              ))}
            {can('super_admin') && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => setDialog('delete')}
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
          </>
        }
      />

      {user.is_suspended && (
        <Card className="tight" style={{ borderColor: 'var(--error)' }}>
          <div className="row">
            <Ban size={16} color="var(--error)" />
            <div className="col">
              <strong style={{ color: 'var(--error)' }}>
                Suspended {formatRelative(user.suspended_at)}
              </strong>
              <span className="tiny muted">{user.suspension_reason}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid-2">
        <div className="stack">
          <Card title="Profile">
            <div className="row" style={{ gap: 'var(--space-4)' }}>
              <Avatar url={user.avatar_url} name={user.full_name} email={user.email} size={56} />
              <div className="col grow">
                <strong style={{ fontSize: 16 }}>{user.full_name || 'Unnamed user'}</strong>
                <span className="tiny muted">{user.email}</span>
                <div className="row" style={{ marginTop: 6 }}>
                  <StatusBadge status={user.role} />
                  {user.is_verified && <StatusBadge status="verified" />}
                  {user.is_suspended && <StatusBadge status="suspended" />}
                </div>
              </div>
            </div>

            <KeyValue
              items={[
                { label: 'Phone', value: user.phone },
                { label: 'Date of birth', value: user.date_of_birth ? `${formatDate(user.date_of_birth)} (${age(user.date_of_birth)})` : null },
                { label: 'Gender', value: user.gender },
                { label: 'Nationality', value: user.nationality },
                { label: 'City', value: user.city },
                { label: 'Preferred area', value: user.preferred_location },
                { label: 'Occupation', value: user.occupation },
                { label: 'Company', value: user.company_name },
                { label: 'Work location', value: user.work_location },
                { label: 'Bio', value: user.bio },
                { label: 'Last seen', value: formatRelative(user.last_seen_at) },
                { label: 'Joined', value: formatDateTime(user.created_at) },
                { label: 'User ID', value: <span className="mono">{user.id}</span> },
              ]}
            />
          </Card>

          <Card className="tight" title="Preferences">
            {data.preferences ? (
              <KeyValue
                items={[
                  { label: 'Notifications', value: data.preferences.notifications_enabled ? 'On' : 'Off' },
                  { label: 'Dark mode', value: data.preferences.dark_mode_enabled ? 'On' : 'Off' },
                  { label: 'Location', value: data.preferences.location_enabled ? 'On' : 'Off' },
                  { label: 'Language', value: data.preferences.language },
                  { label: 'Currency', value: data.preferences.currency },
                ]}
              />
            ) : (
              <span className="tiny muted">No preferences saved.</span>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card className="tight" title="At a glance">
            <KeyValue
              items={[
                { label: 'Properties', value: formatNumber(data.properties.length) },
                { label: 'Roommate ads', value: formatNumber(data.roommate_listings.length) },
                { label: 'Bookings made', value: formatNumber(data.bookings.length) },
                { label: 'Bookings received', value: formatNumber(data.host_bookings.length) },
                { label: 'Payments', value: formatNumber(data.payments.length) },
                { label: 'Reviews written', value: formatNumber(data.reviews.length) },
                { label: 'Conversations', value: formatNumber(data.conversation_count) },
                { label: 'Favorites', value: formatNumber(data.favorites.length) },
              ]}
            />
          </Card>

          <Card className="tight" title="Payment methods">
            {data.payment_methods.length ? (
              <div className="list-rows">
                {data.payment_methods.map((method) => (
                  <div key={method.id} className="list-row">
                    <div className="col grow">
                      <span>
                        {titleCase(method.type)} {method.provider ? `- ${method.provider}` : ''}
                      </span>
                      <span className="tiny muted">
                        **** {method.last_four} - expires {method.expiry_month}/{method.expiry_year}
                      </span>
                    </div>
                    {method.is_default && <span className="badge badge-primary">Default</span>}
                  </div>
                ))}
              </div>
            ) : (
              <span className="tiny muted">No saved payment methods.</span>
            )}
          </Card>
        </div>
      </div>

      <Card className="flush">
        <div style={{ padding: '0 var(--space-4)' }}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        {tab === 'listings' && (
          <>
            <DataTable
              rows={data.properties}
              emptyTitle="No property listings"
              onRowClick={(row) => navigate(`/properties/${row.id}`)}
              columns={[
                { key: 'title', label: 'Property', render: (r) => <span className="cell-title">{r.title}</span> },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.deleted_at ? 'deleted' : r.status} /> },
                { key: 'city', label: 'City' },
                { key: 'price', label: 'Price', align: 'right', render: (r) => formatMoney(r.price) },
                { key: 'view_count', label: 'Views', align: 'right', render: (r) => formatNumber(r.view_count) },
                { key: 'created_at', label: 'Created', align: 'right', render: (r) => formatDate(r.created_at) },
              ]}
            />
            {data.roommate_listings.length > 0 && (
              <DataTable
                rows={data.roommate_listings}
                columns={[
                  { key: 'title', label: 'Roommate ad', render: (r) => <span className="cell-title">{r.title}</span> },
                  { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
                  { key: 'city', label: 'City' },
                  {
                    key: 'budget',
                    label: 'Budget',
                    align: 'right',
                    render: (r) => `${formatMoney(r.budget_min)} - ${formatMoney(r.budget_max)}`,
                  },
                  { key: 'created_at', label: 'Created', align: 'right', render: (r) => formatDate(r.created_at) },
                ]}
              />
            )}
          </>
        )}

        {tab === 'bookings' && (
          <DataTable
            rows={data.bookings}
            emptyTitle="No bookings"
            onRowClick={(row) => navigate(`/bookings?q=${row.reference}`)}
            columns={[
              { key: 'reference', label: 'Reference', render: (r) => <span className="mono">{r.reference}</span> },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'check_in_date', label: 'Check in', render: (r) => formatDate(r.check_in_date) },
              { key: 'check_out_date', label: 'Check out', render: (r) => formatDate(r.check_out_date) },
              { key: 'total_amount', label: 'Amount', align: 'right', render: (r) => formatMoney(r.total_amount) },
            ]}
          />
        )}

        {tab === 'payments' && (
          <DataTable
            rows={data.payments}
            emptyTitle="No payments"
            columns={[
              { key: 'transaction_id', label: 'Transaction', render: (r) => <span className="mono">{r.transaction_id || r.id.slice(0, 8)}</span> },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatMoney(r.amount, r.currency) },
              { key: 'created_at', label: 'Created', align: 'right', render: (r) => formatDateTime(r.created_at) },
            ]}
          />
        )}

        {tab === 'activity' && (
          <DataTable
            rows={data.searches}
            emptyTitle="No search history"
            columns={[
              { key: 'query', label: 'Search query' },
              {
                key: 'results_count',
                label: 'Results',
                align: 'right',
                render: (r) => (
                  <span className={Number(r.results_count) === 0 ? 'neg num' : 'num'}>
                    {formatNumber(r.results_count)}
                  </span>
                ),
              },
              { key: 'created_at', label: 'When', align: 'right', render: (r) => formatRelative(r.created_at) },
            ]}
          />
        )}

        {tab === 'reviews' && (
          <DataTable
            rows={data.reviews}
            emptyTitle="No reviews written"
            columns={[
              { key: 'rating', label: 'Rating', render: (r) => <Stars rating={r.rating} /> },
              { key: 'title', label: 'Title', render: (r) => r.title || <span className="muted">--</span> },
              { key: 'content', label: 'Review', render: (r) => <span className="cell-sub">{r.content}</span> },
              { key: 'is_visible', label: 'Visible', render: (r) => <StatusBadge status={r.is_visible ? 'active' : 'inactive'} label={r.is_visible ? 'Visible' : 'Hidden'} /> },
              { key: 'created_at', label: 'When', align: 'right', render: (r) => formatDate(r.created_at) },
            ]}
          />
        )}

        {tab === 'devices' && (
          <>
            <DataTable
              rows={data.devices}
              emptyTitle="No bound devices"
              columns={[
                {
                  key: 'device_name',
                  label: 'Device',
                  render: (r) => (
                    <div className="col">
                      <span className="cell-title">{r.device_name || 'Unknown device'}</span>
                      <span className="cell-sub">
                        {[r.device_manufacturer, r.device_model].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  ),
                },
                { key: 'platform', label: 'Platform', render: (r) => `${r.platform || '--'} ${r.os_version || ''}` },
                { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
                { key: 'last_used_at', label: 'Last used', align: 'right', render: (r) => formatRelative(r.last_used_at) },
                {
                  key: 'actions',
                  label: '',
                  align: 'right',
                  render: (r) =>
                    r.is_active && can('super_admin', 'admin') ? (
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () => api.post(`/api/users/${id}/devices/${r.id}/unbind`, {}),
                            'Device unbound'
                          )
                        }
                      >
                        Unbind
                      </button>
                    ) : null,
                },
              ]}
            />
            {data.push_tokens.length > 0 && (
              <DataTable
                rows={data.push_tokens}
                columns={[
                  { key: 'device_type', label: 'Push token', render: (r) => titleCase(r.device_type || 'unknown') },
                  { key: 'device_name', label: 'Device' },
                  { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
                  { key: 'last_used_at', label: 'Last used', align: 'right', render: (r) => formatRelative(r.last_used_at) },
                ]}
              />
            )}
          </>
        )}
      </Card>

      {dialog === 'suspend' && (
        <ConfirmDialog
          title="Suspend this user?"
          message="They will be signed out immediately and blocked from signing in to the mobile app. Their listings stay visible."
          confirmLabel="Suspend user"
          danger
          requireReason
          busy={busy}
          onClose={closeDialog}
          onConfirm={async (reason) => {
            await run(() => api.post(`/api/users/${id}/suspend`, { reason }), 'User suspended');
            closeDialog();
          }}
        />
      )}

      {dialog === 'signout' && (
        <ConfirmDialog
          title="Force sign-out?"
          message="All active sessions for this user will be revoked. They can sign in again straight away."
          confirmLabel="Revoke sessions"
          requireReason
          busy={busy}
          onClose={closeDialog}
          onConfirm={async (reason) => {
            await run(() => api.post(`/api/users/${id}/sign-out`, { reason }), 'Sessions revoked');
            closeDialog();
          }}
        />
      )}

      {dialog === 'delete' && (
        <ConfirmDialog
          title="Permanently delete this account?"
          message="This cascades: their listings, bookings, messages, reviews and favorites are all destroyed. This cannot be undone. Consider suspending instead."
          confirmLabel="Delete permanently"
          danger
          requireReason
          confirmWord="DELETE"
          busy={busy}
          onClose={closeDialog}
          onConfirm={async (reason) => {
            const result = await run(
              () => api.del(`/api/users/${id}`, { reason }),
              'Account deleted'
            );
            closeDialog();
            if (result) navigate('/users');
          }}
        />
      )}
    </>
  );
};

export default UserDetail;
