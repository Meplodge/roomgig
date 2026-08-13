import { useState } from 'react';
import PageHeader, { ExportButton } from '../components/PageHeader';
import { Card, DataTable, Modal, Pagination, SearchInput } from '../components/ui';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { downloadCsv, formatDateTime, formatNumber } from '../lib/format';

const TABLES = [
  'profiles',
  'properties',
  'roommate_listings',
  'bookings',
  'reviews',
  'admin_users',
  'admin_settings',
  'notifications',
  'conversations',
  'device_bindings',
];

const AuditLog = () => {
  const [entry, setEntry] = useState(null);
  const list = usePagedQuery('audit-log', '/api/audit-log', { pageSize: 50 });

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle={`${formatNumber(list.total)} recorded actions`}
        actions={
          <ExportButton
            disabled={!list.rows.length}
            onExport={() =>
              downloadCsv(
                'roomgig-audit-log.csv',
                list.rows.map((r) => ({
                  when: r.created_at,
                  admin: r.admin_email,
                  action: r.action,
                  table: r.target_table,
                  target_id: r.target_id,
                  reason: r.reason,
                  ip: r.ip,
                }))
              )
            }
          />
        }
      />

      <Card className="flush">
        <div className="filter-bar" style={{ padding: 'var(--space-4)' }}>
          <SearchInput
            value={list.filters.action || ''}
            onChange={(value) => list.setFilter('action', value)}
            placeholder="Action, e.g. user.suspend"
          />
          <select
            className="select"
            value={list.filters.table || ''}
            onChange={(e) => list.setFilter('table', e.target.value)}
          >
            <option value="">All tables</option>
            {TABLES.map((table) => (
              <option key={table} value={table}>
                {table}
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
          rows={list.rows}
          loading={list.query.isLoading}
          error={list.query.error}
          onRetry={list.query.refetch}
          onRowClick={setEntry}
          emptyTitle="No actions recorded yet"
          emptyMessage="Every mutating admin action will appear here."
          columns={[
            {
              key: 'created_at',
              label: 'When',
              render: (r) => <span className="tiny">{formatDateTime(r.created_at)}</span>,
            },
            { key: 'admin_email', label: 'Administrator', render: (r) => r.admin_email || 'Unknown' },
            {
              key: 'action',
              label: 'Action',
              render: (r) => <span className="badge badge-primary">{r.action}</span>,
            },
            { key: 'target_table', label: 'Table', render: (r) => <span className="mono">{r.target_table || '--'}</span> },
            {
              key: 'target_id',
              label: 'Target',
              render: (r) => <span className="mono">{r.target_id ? r.target_id.slice(0, 8) : '--'}</span>,
            },
            {
              key: 'reason',
              label: 'Reason',
              render: (r) => <span className="cell-sub">{r.reason || '--'}</span>,
            },
            { key: 'ip', label: 'IP', align: 'right', render: (r) => <span className="mono">{r.ip || '--'}</span> },
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

      {entry && (
        <Modal title={entry.action} onClose={() => setEntry(null)} wide>
          <dl className="kv">
            <dt>When</dt>
            <dd>{formatDateTime(entry.created_at)}</dd>
            <dt>Administrator</dt>
            <dd>{entry.admin_email || 'Unknown'}</dd>
            <dt>Target</dt>
            <dd className="mono">
              {entry.target_table}/{entry.target_id}
            </dd>
            <dt>Reason</dt>
            <dd>{entry.reason || 'None given'}</dd>
            <dt>IP</dt>
            <dd className="mono">{entry.ip || '--'}</dd>
            <dt>User agent</dt>
            <dd className="tiny">{entry.user_agent || '--'}</dd>
          </dl>

          <div className="grid-halves">
            <div className="col" style={{ gap: 6 }}>
              <span className="micro-label">Before</span>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-muted)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'auto',
                  maxHeight: 260,
                  margin: 0,
                }}
              >
                {JSON.stringify(entry.before, null, 2) || 'null'}
              </pre>
            </div>
            <div className="col" style={{ gap: 6 }}>
              <span className="micro-label">After</span>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-muted)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'auto',
                  maxHeight: 260,
                  margin: 0,
                }}
              >
                {JSON.stringify(entry.after, null, 2) || 'null'}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AuditLog;
