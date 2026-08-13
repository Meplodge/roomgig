import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ShieldCheck, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Card, ConfirmDialog, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';
import { formatMoney, formatNumber, formatRelative } from '../lib/format';

const Moderation = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [rejecting, setRejecting] = useState(null);

  const query = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: () => api.get('/api/properties/moderation-queue'),
  });

  const { busy, run } = useAction(toast, () => query.refetch());
  const canModerate = can('super_admin', 'admin', 'moderator');
  const items = query.data?.data || [];

  return (
    <>
      <PageHeader
        title="Moderation Queue"
        subtitle="Listings flagged for a human review"
        actions={
          <span className="badge badge-warning">{formatNumber(query.data?.count || 0)} flagged</span>
        }
      />

      <Card className="tight">
        <p className="tiny muted">
          Listings are published immediately in the mobile app, so this queue is reactive: it
          surfaces anything that looks incomplete, mispriced, or posted by a suspended host. Nothing
          here is hidden from users until you act on it.
        </p>
      </Card>

      {query.isLoading ? (
        <Card>
          <Skeleton height={200} />
        </Card>
      ) : query.isError ? (
        <Card>
          <ErrorState error={query.error} onRetry={query.refetch} />
        </Card>
      ) : !items.length ? (
        <Card>
          <EmptyState
            title="Queue is clear"
            message="Nothing currently needs attention."
            icon={ShieldCheck}
          />
        </Card>
      ) : (
        <div className="stack">
          {items.map((item) => (
            <Card key={item.id} className="tight">
              <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                {item.thumbnail ? (
                  <img
                    className="thumb"
                    style={{ width: 84, height: 64 }}
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span className="thumb placeholder" style={{ width: 84, height: 64 }}>
                    <Building2 size={18} />
                  </span>
                )}

                <div className="col grow" style={{ gap: 6, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/properties/${item.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      font: 'inherit',
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {item.title}
                  </button>
                  <span className="tiny muted">
                    {item.profiles?.full_name || item.host_name || 'Unknown host'} -{' '}
                    {item.city || 'Unknown city'} - {formatMoney(item.price)} -{' '}
                    {formatRelative(item.created_at)}
                  </span>
                  <div className="tag-list">
                    <StatusBadge status={item.status} />
                    {item.flags.map((flag) => (
                      <span className="flag-chip" key={flag}>
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {canModerate && (
                  <div className="row" style={{ gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () =>
                            api.post(`/api/properties/${item.id}/moderate`, { decision: 'approve' }),
                          'Listing approved'
                        )
                      }
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={busy}
                      onClick={() => setRejecting(item)}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {rejecting && (
        <ConfirmDialog
          title={`Reject "${rejecting.title}"?`}
          message="The listing becomes inactive and disappears from the mobile app."
          confirmLabel="Reject listing"
          danger
          requireReason
          busy={busy}
          onClose={() => setRejecting(null)}
          onConfirm={async (reason) => {
            await run(
              () =>
                api.post(`/api/properties/${rejecting.id}/moderate`, {
                  decision: 'reject',
                  reason,
                }),
              'Listing rejected'
            );
            setRejecting(null);
          }}
        />
      )}
    </>
  );
};

export default Moderation;
