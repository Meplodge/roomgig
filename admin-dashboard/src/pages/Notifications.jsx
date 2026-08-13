import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Send, Smartphone } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  Card,
  DataTable,
  EmptyState,
  Modal,
  Pagination,
  StatCard,
  StatusBadge,
} from '../components/ui';
import { DonutChart, RankedBars } from '../components/charts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRange } from '../context/RangeContext';
import { useToast } from '../context/ToastContext';
import { usePagedQuery, useAction } from '../hooks/usePagedQuery';
import { formatDateTime, formatNumber, formatPercent, titleCase } from '../lib/format';

const BroadcastModal = ({ onClose, onSent }) => {
  const toast = useToast();
  const { busy, run } = useAction(toast);
  const [form, setForm] = useState({ title: '', message: '', type: 'system', city: '', role: '' });

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <Modal
      title="Send a broadcast"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !form.title.trim() || !form.message.trim()}
            onClick={async () => {
              const result = await run(
                () => api.post('/api/notifications/broadcast', form),
                'Broadcast queued'
              );
              if (result) {
                toast.success(`Sent to ${formatNumber(result.data.recipients)} users`);
                onSent?.();
                onClose();
              }
            }}
          >
            {busy && <span className="spinner" />}
            <Send size={15} /> Send
          </button>
        </>
      }
    >
      <p className="tiny muted">
        Creates an in-app notification for every matching user. Suspended accounts are excluded.
        Delivery to devices happens through the existing Expo push pipeline.
      </p>
      <div className="field">
        <label htmlFor="b-title">Title</label>
        <input id="b-title" className="input" value={form.title} onChange={update('title')} />
      </div>
      <div className="field">
        <label htmlFor="b-message">Message</label>
        <textarea id="b-message" className="textarea" value={form.message} onChange={update('message')} />
      </div>
      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <div className="field grow">
          <label htmlFor="b-type">Type</label>
          <select id="b-type" className="select" value={form.type} onChange={update('type')}>
            <option value="system">System</option>
            <option value="promotion">Promotion</option>
          </select>
        </div>
        <div className="field grow">
          <label htmlFor="b-role">Audience role</label>
          <select id="b-role" className="select" value={form.role} onChange={update('role')}>
            <option value="">Everyone</option>
            <option value="user">Users</option>
            <option value="host">Hosts</option>
            <option value="agent">Agents</option>
          </select>
        </div>
        <div className="field grow">
          <label htmlFor="b-city">City contains</label>
          <input id="b-city" className="input" value={form.city} onChange={update('city')} />
        </div>
      </div>
    </Modal>
  );
};

const Notifications = () => {
  const { from, to } = useRange();
  const { can } = useAuth();
  const [broadcasting, setBroadcasting] = useState(false);

  const stats = useQuery({
    queryKey: ['notification-stats', from, to],
    queryFn: () => api.get('/api/notifications/stats', { from, to }),
  });
  const list = usePagedQuery('notifications', '/api/notifications');
  const s = stats.data?.data || {};

  const typeData = Object.entries(s.by_type || {}).map(([label, value]) => ({
    label: titleCase(label),
    value,
  }));
  const deviceData = Object.entries(s.tokens_by_device || {}).map(([label, value]) => ({
    label: titleCase(label),
    value,
  }));

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Delivery health and broadcasts"
        showRange
        actions={
          can('super_admin', 'admin') && (
            <button type="button" className="btn btn-primary" onClick={() => setBroadcasting(true)}>
              <Send size={15} /> Broadcast
            </button>
          )
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Notifications sent"
          value={formatNumber(s.total)}
          icon={Bell}
          caption={`${formatPercent(s.read_rate)} read`}
          loading={stats.isLoading}
        />
        <StatCard
          label="Push delivered"
          value={formatNumber(s.push_sent)}
          loading={stats.isLoading}
        />
        <StatCard
          label="Push failures"
          value={formatNumber(s.push_failed)}
          caption={s.push_failed ? 'Needs attention' : 'All healthy'}
          loading={stats.isLoading}
        />
        <StatCard
          label="Active devices"
          value={formatNumber(s.tokens_active)}
          icon={Smartphone}
          caption={`${formatNumber(s.tokens_total)} registered tokens`}
          loading={stats.isLoading}
        />
      </div>

      <div className="grid-thirds">
        <Card title="By type" subtitle="In the selected range">
          <DonutChart data={typeData} />
        </Card>
        <Card title="Registered devices">
          {deviceData.length ? <RankedBars data={deviceData} /> : <EmptyState title="No push tokens" />}
        </Card>
        <Card title="Top push errors">
          {s.push_errors?.length ? (
            <div className="list-rows">
              {s.push_errors.map((error) => (
                <div key={error.message} className="list-row">
                  <span className="tiny grow truncate" title={error.message}>
                    {error.message}
                  </span>
                  <span className="badge badge-error">{formatNumber(error.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No delivery errors" message="Every push has been accepted." />
          )}
        </Card>
      </div>

      <Card className="flush" title="Recent notifications">
        <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
          <select
            className="select"
            value={list.filters.failed || ''}
            onChange={(e) => list.setFilter('failed', e.target.value)}
          >
            <option value="">All notifications</option>
            <option value="true">Failed pushes only</option>
          </select>
          <select
            className="select"
            value={list.filters.read || ''}
            onChange={(e) => list.setFilter('read', e.target.value)}
          >
            <option value="">Any read state</option>
            <option value="false">Unread only</option>
          </select>
        </div>

        <DataTable
          rows={list.rows}
          loading={list.query.isLoading}
          error={list.query.error}
          onRetry={list.query.refetch}
          emptyTitle="No notifications"
          columns={[
            { key: 'type', label: 'Type', render: (r) => <StatusBadge status="info" label={titleCase(r.type)} /> },
            {
              key: 'title',
              label: 'Notification',
              render: (r) => (
                <div className="col" style={{ minWidth: 0 }}>
                  <span className="cell-title">{r.title}</span>
                  <span className="cell-sub">{r.message}</span>
                </div>
              ),
            },
            { key: 'recipient', label: 'Recipient', render: (r) => r.profiles?.full_name || r.profiles?.email || '--' },
            {
              key: 'push',
              label: 'Push',
              render: (r) =>
                r.push_error ? (
                  <span className="badge badge-error" title={r.push_error}>
                    Failed
                  </span>
                ) : r.push_sent ? (
                  <span className="badge badge-success">Sent</span>
                ) : (
                  <span className="tiny muted">--</span>
                ),
            },
            { key: 'is_read', label: 'Read', render: (r) => (r.is_read ? 'Yes' : 'No') },
            {
              key: 'created_at',
              label: 'When',
              align: 'right',
              render: (r) => <span className="tiny muted">{formatDateTime(r.created_at)}</span>,
            },
          ]}
        />

        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
        />
      </Card>

      {broadcasting && (
        <BroadcastModal onClose={() => setBroadcasting(false)} onSent={() => list.query.refetch()} />
      )}
    </>
  );
};

export default Notifications;
