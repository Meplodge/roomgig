import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Card, ConfirmDialog, DataTable, Modal, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';
import { formatDateTime, formatRelative, titleCase } from '../lib/format';

const ROLES = ['super_admin', 'admin', 'moderator', 'analyst'];

const ROLE_HELP = {
  super_admin: 'Full control, including admins, deletions and reading conversations.',
  admin: 'Manage users, listings, bookings and broadcasts. Cannot manage admins.',
  moderator: 'Moderate listings and reviews, suspend users. No deletions.',
  analyst: 'Read-only access to analytics and records.',
};

const InviteModal = ({ onClose, onDone }) => {
  const toast = useToast();
  const { busy, run } = useAction(toast);
  const [form, setForm] = useState({ email: '', full_name: '', role: 'moderator' });

  return (
    <Modal
      title="Add an administrator"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !form.email.includes('@')}
            onClick={async () => {
              const result = await run(() => api.post('/api/admins', form), 'Administrator added');
              if (result) {
                if (result.invited) toast.success('Invite email sent so they can set a password.');
                onDone();
                onClose();
              }
            }}
          >
            {busy && <span className="spinner" />}
            Add administrator
          </button>
        </>
      }
    >
      <p className="tiny muted">
        If no Supabase Auth account exists for this email, one is created and an invite is sent so
        they can choose their own password.
      </p>
      <div className="field">
        <label htmlFor="a-email">Email</label>
        <input
          id="a-email"
          className="input"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="a-name">Full name</label>
        <input
          id="a-name"
          className="input"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="a-role">Role</label>
        <select
          id="a-role"
          className="select"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {titleCase(role)}
            </option>
          ))}
        </select>
        <span className="tiny muted">{ROLE_HELP[form.role]}</span>
      </div>
    </Modal>
  );
};

const Admins = () => {
  const toast = useToast();
  const { admin } = useAuth();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState(null);

  const query = useQuery({ queryKey: ['admins'], queryFn: () => api.get('/api/admins') });
  const { busy, run } = useAction(toast, () => query.refetch());

  return (
    <>
      <PageHeader
        title="Administrators"
        subtitle="Who can access this dashboard"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>
            <UserPlus size={15} /> Add admin
          </button>
        }
      />

      <Card className="flush">
        <DataTable
          rows={query.data?.data}
          loading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          emptyTitle="No administrators"
          columns={[
            {
              key: 'email',
              label: 'Administrator',
              render: (row) => (
                <div className="col" style={{ minWidth: 0 }}>
                  <span className="cell-title">
                    {row.full_name || 'Unnamed'}
                    {row.id === admin?.id && <span className="tiny muted"> (you)</span>}
                  </span>
                  <span className="cell-sub">{row.email}</span>
                </div>
              ),
            },
            {
              key: 'role',
              label: 'Role',
              render: (row) => (
                <select
                  className="select btn-sm"
                  value={row.role}
                  disabled={busy}
                  onChange={(e) =>
                    run(
                      () => api.patch(`/api/admins/${row.id}`, { role: e.target.value }),
                      'Role updated'
                    )
                  }
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {titleCase(role)}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: 'is_active',
              label: 'Status',
              render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
            },
            {
              key: 'last_login_at',
              label: 'Last login',
              render: (row) => <span className="tiny muted">{formatRelative(row.last_login_at)}</span>,
            },
            {
              key: 'created_at',
              label: 'Added',
              render: (row) => <span className="tiny muted">{formatDateTime(row.created_at)}</span>,
            },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (row) =>
                row.id === admin?.id ? null : (
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => api.patch(`/api/admins/${row.id}`, { is_active: !row.is_active }),
                          row.is_active ? 'Administrator deactivated' : 'Administrator reactivated'
                        )
                      }
                    >
                      {row.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={busy}
                      onClick={() => setRemoving(row)}
                    >
                      Remove
                    </button>
                  </div>
                ),
            },
          ]}
        />
      </Card>

      <Card className="tight" title="Role permissions">
        <dl className="kv">
          {ROLES.map((role) => (
            <div key={role} style={{ display: 'contents' }}>
              <dt>{titleCase(role)}</dt>
              <dd className="muted">{ROLE_HELP[role]}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {inviting && <InviteModal onClose={() => setInviting(false)} onDone={() => query.refetch()} />}

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.email}?`}
          message="They lose dashboard access immediately. Their Supabase Auth account is left untouched, so they can still use the mobile app."
          confirmLabel="Remove access"
          danger
          requireReason
          busy={busy}
          onClose={() => setRemoving(null)}
          onConfirm={async (reason) => {
            await run(() => api.del(`/api/admins/${removing.id}`, { reason }), 'Access removed');
            setRemoving(null);
          }}
        />
      )}
    </>
  );
};

export default Admins;
