import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Card, ErrorState, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';

const PASSWORD_MASK = '••••••••';

const EmailConfig = () => {
  const toast = useToast();
  const { busy, run } = useAction(toast);

  const query = useQuery({
    queryKey: ['email-config'],
    queryFn: () => api.get('/api/email-config'),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (query.data?.data) setForm(query.data.data);
  }, [query.data]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form) return;
    run(() => api.put('/api/email-config', form), 'Email configuration saved');
  };

  return (
    <>
      <PageHeader
        title="Email Configuration"
        subtitle="SMTP settings used for admin invites and outgoing notifications"
      />

      {query.isLoading ? (
        <Card>
          <div style={{ padding: 'var(--space-4)' }}>
            <Skeleton height={200} />
          </div>
        </Card>
      ) : query.isError ? (
        <Card>
          <ErrorState error={query.error} onRetry={query.refetch} />
        </Card>
      ) : form ? (
        <form className="col" style={{ gap: 'var(--space-4)' }} onSubmit={submit}>
          <Card title="Sender identity">
            <div className="grid-halves">
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">From name</span>
                <input
                  className="input"
                  value={form.from_name || ''}
                  onChange={(e) => set('from_name', e.target.value)}
                  disabled={busy}
                  placeholder="RoomGig"
                />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">From email</span>
                <input
                  className="input"
                  type="email"
                  value={form.from_email || ''}
                  onChange={(e) => set('from_email', e.target.value)}
                  disabled={busy}
                  placeholder="no-reply@roomgig.com"
                  required
                />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">Reply-to (optional)</span>
                <input
                  className="input"
                  type="email"
                  value={form.reply_to || ''}
                  onChange={(e) => set('reply_to', e.target.value)}
                  disabled={busy}
                  placeholder="support@roomgig.com"
                />
              </label>
              <label className="col" style={{ gap: 6, justifyContent: 'center' }}>
                <span className="micro-label">Enable email sending</span>
                <select
                  className="select"
                  value={String(form.enabled)}
                  onChange={(e) => set('enabled', e.target.value === 'true')}
                  disabled={busy}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </label>
            </div>
          </Card>

          <Card title="SMTP server">
            <div className="grid-halves">
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">SMTP host</span>
                <input
                  className="input"
                  value={form.smtp_host || ''}
                  onChange={(e) => set('smtp_host', e.target.value)}
                  disabled={busy}
                  placeholder="smtp.gmail.com"
                />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">SMTP port</span>
                <input
                  className="input"
                  type="number"
                  value={form.smtp_port ?? 587}
                  onChange={(e) => set('smtp_port', Number(e.target.value))}
                  disabled={busy}
                  placeholder="587"
                />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">SMTP username</span>
                <input
                  className="input"
                  value={form.smtp_username || ''}
                  onChange={(e) => set('smtp_username', e.target.value)}
                  disabled={busy}
                  placeholder="user@example.com"
                />
              </label>
              <label className="col" style={{ gap: 6 }}>
                <span className="micro-label">SMTP password</span>
                <input
                  className="input"
                  type="password"
                  value={form.smtp_password || ''}
                  onChange={(e) => set('smtp_password', e.target.value)}
                  disabled={busy}
                  placeholder={form.smtp_password === PASSWORD_MASK ? 'Enter a new password to replace' : 'App password'}
                  autoComplete="new-password"
                />
                {form.smtp_password === PASSWORD_MASK && (
                  <span className="tiny muted">
                    A password is stored. Leave this field as-is to keep it, or type a new one to replace it.
                  </span>
                )}
              </label>
              <label className="col" style={{ gap: 6, justifyContent: 'center' }}>
                <span className="micro-label">Encryption</span>
                <select
                  className="select"
                  value={String(form.smtp_secure)}
                  onChange={(e) => set('smtp_secure', e.target.value === 'true')}
                  disabled={busy}
                >
                  <option value="true">TLS / SSL</option>
                  <option value="false">None</option>
                </select>
              </label>
            </div>
          </Card>

          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <span className="spinner" /> : <Save size={15} />}
              Save configuration
            </button>
            <span className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} /> Changes take effect immediately for new outgoing emails.
            </span>
          </div>
        </form>
      ) : null}
    </>
  );
};

export default EmailConfig;
