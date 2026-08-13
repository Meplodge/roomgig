import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, MessagesSquare } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  Avatar,
  Card,
  ConfirmDialog,
  DataTable,
  Modal,
  Pagination,
  StatCard,
} from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRange } from '../context/RangeContext';
import { useToast } from '../context/ToastContext';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { formatDateTime, formatNumber, formatRelative } from '../lib/format';

const Messaging = () => {
  const { from, to } = useRange();
  const toast = useToast();
  const { can } = useAuth();
  const [confirming, setConfirming] = useState(null);
  const [thread, setThread] = useState(null);
  const [busy, setBusy] = useState(false);

  const stats = useQuery({
    queryKey: ['messaging-stats', from, to],
    queryFn: () => api.get('/api/messaging/stats', { from, to }),
  });

  const list = usePagedQuery('conversations', '/api/messaging/conversations');
  const s = stats.data?.data || {};
  const canRead = can('super_admin');

  const openThread = async (conversation, reason) => {
    setBusy(true);
    try {
      const result = await api.post(`/api/messaging/conversations/${conversation.id}/read`, {
        reason,
      });
      setThread({ ...result.data, conversation: { ...conversation, ...result.data.conversation } });
      setConfirming(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'participants',
      label: 'Participants',
      render: (row) => (
        <div className="cell-media">
          <Avatar
            url={row.participant?.avatar_url}
            name={row.participant?.full_name}
            size={26}
          />
          <Avatar
            url={row.other_participant?.avatar_url}
            name={row.other_participant?.full_name}
            size={26}
          />
          <div className="col" style={{ minWidth: 0 }}>
            <span className="cell-title">
              {row.participant?.full_name || 'Unknown'} &harr;{' '}
              {row.other_participant?.full_name || 'Unknown'}
            </span>
            <span className="cell-sub">{row.properties?.title || 'No listing attached'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'message_count',
      label: 'Messages',
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.message_count)}</span>,
    },
    {
      key: 'unread_count',
      label: 'Unread',
      align: 'right',
      render: (row) => <span className="num">{formatNumber(row.unread_count)}</span>,
    },
    {
      key: 'last_message_at',
      label: 'Last activity',
      align: 'right',
      render: (row) => <span className="tiny muted">{formatRelative(row.last_message_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) =>
        canRead ? (
          <button type="button" className="btn btn-sm" onClick={() => setConfirming(row)}>
            <Lock size={13} /> Open
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Messaging" subtitle="Volume oversight, not surveillance" showRange />

      <Card className="tight">
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Lock size={15} color="var(--primary)" />
          <span className="tiny muted">
            Message contents are hidden by default. Only a super admin can open a thread, a written
            reason is required, and every access is permanently recorded in the audit log.
          </span>
        </div>
      </Card>

      <div className="stat-grid">
        <StatCard
          label="Conversations started"
          value={formatNumber(s.conversations)}
          icon={MessagesSquare}
          loading={stats.isLoading}
        />
        <StatCard label="Messages sent" value={formatNumber(s.messages)} loading={stats.isLoading} />
        <StatCard
          label="Avg per conversation"
          value={(s.avg_messages_per_conversation || 0).toFixed(1)}
          loading={stats.isLoading}
        />
        <StatCard
          label="Unread backlog"
          value={formatNumber(s.unread)}
          caption="All time"
          loading={stats.isLoading}
        />
      </div>

      <Card className="flush" title="Conversations">
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.query.isLoading}
          error={list.query.error}
          onRetry={list.query.refetch}
          emptyTitle="No conversations yet"
        />
        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
        />
      </Card>

      {confirming && (
        <ConfirmDialog
          title="Read this conversation?"
          message="This exposes private messages between two users. Your identity, the reason below and the timestamp will be written to the audit log."
          confirmLabel="Open conversation"
          danger
          requireReason
          busy={busy}
          onClose={() => setConfirming(null)}
          onConfirm={(reason) => openThread(confirming, reason)}
        />
      )}

      {thread && (
        <Modal title="Conversation" onClose={() => setThread(null)} wide>
          <div className="stack" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {thread.messages.length === 0 && <span className="muted">No messages.</span>}
            {thread.messages.map((message) => (
              <div key={message.id} className="col" style={{ gap: 2 }}>
                <span className="tiny muted">
                  {message.sender_id === thread.conversation.user_id
                    ? thread.conversation.participant?.full_name || 'Participant A'
                    : thread.conversation.other_participant?.full_name || 'Participant B'}{' '}
                  - {formatDateTime(message.created_at)}
                </span>
                <span
                  style={{
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-3)',
                  }}
                >
                  {message.content}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default Messaging;
