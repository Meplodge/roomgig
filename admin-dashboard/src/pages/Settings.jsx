import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Monitor, Moon, Sun } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Card, ErrorState, KeyValue, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAction } from '../hooks/usePagedQuery';
import { titleCase } from '../lib/format';

const SettingRow = ({ setting, disabled, onSave, busy }) => {
  const [value, setValue] = useState(JSON.stringify(setting.value));

  useEffect(() => setValue(JSON.stringify(setting.value)), [setting.value]);

  const isBoolean = typeof setting.value === 'boolean';
  const dirty = value !== JSON.stringify(setting.value);

  return (
    <div className="list-row">
      <div className="col grow" style={{ minWidth: 0 }}>
        <span className="cell-title">{titleCase(setting.key)}</span>
        <span className="cell-sub">{setting.description}</span>
      </div>

      {isBoolean ? (
        <select
          className="select"
          value={value}
          disabled={disabled || busy}
          onChange={(e) => {
            setValue(e.target.value);
            onSave(setting.key, e.target.value === 'true');
          }}
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      ) : (
        <>
          <input
            className="input"
            style={{ width: 120 }}
            value={value}
            disabled={disabled || busy}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={disabled || busy || !dirty}
            onClick={() => {
              try {
                onSave(setting.key, JSON.parse(value));
              } catch {
                onSave(setting.key, value);
              }
            }}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { admin, can } = useAuth();

  const query = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/api/settings') });
  const health = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/api/settings/system/health'),
  });
  const { busy, run } = useAction(toast, () => query.refetch());

  const canEdit = can('super_admin', 'admin');
  const checks = health.data?.data || {};

  return (
    <>
      <PageHeader title="Settings" subtitle="Dashboard preferences and platform configuration" />

      <div className="grid-halves">
        <Card title="Appearance">
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`btn ${theme === option.id ? 'btn-primary' : ''}`}
                onClick={() => setTheme(option.id)}
              >
                <option.icon size={15} /> {option.label}
              </button>
            ))}
            <button
              type="button"
              className="btn"
              onClick={() => {
                localStorage.removeItem('roomgig-admin-theme');
                setTheme(
                  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                );
                toast.success('Following your system theme');
              }}
            >
              <Monitor size={15} /> System
            </button>
          </div>
          <p className="tiny muted">
            Your choice is stored in this browser only. "System" clears it and follows your OS.
          </p>
        </Card>

        <Card title="Your account">
          <KeyValue
            items={[
              { label: 'Name', value: admin?.full_name || 'Not set' },
              { label: 'Email', value: admin?.email },
              { label: 'Role', value: titleCase(admin?.role) },
            ]}
          />
          <p className="tiny muted">
            Roles are managed on the Administrators page by a super admin.
          </p>
        </Card>
      </div>

      <Card className="flush" title="Platform configuration">
        {query.isLoading ? (
          <div style={{ padding: 'var(--space-4)' }}>
            <Skeleton height={120} />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : (
          <div className="list-rows" style={{ padding: '0 var(--space-5) var(--space-4)' }}>
            {(query.data?.data || []).map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                disabled={!canEdit}
                busy={busy}
                onSave={(key, value) =>
                  run(() => api.patch(`/api/settings/${key}`, { value }), 'Setting saved')
                }
              />
            ))}
            {!canEdit && (
              <p className="tiny muted" style={{ paddingTop: 'var(--space-3)' }}>
                Your role can view but not change these values.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title="System health">
        <KeyValue
          items={[
            {
              label: 'Database',
              value: `${checks.database?.message || '--'}${
                checks.database?.latency_ms != null ? ` (${checks.database.latency_ms}ms)` : ''
              }`,
            },
            { label: 'Email service', value: checks.email?.message || '--' },
            { label: 'Push delivery', value: checks.push?.message || '--' },
            { label: 'Admin API', value: import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000' },
            { label: 'Supabase project', value: import.meta.env.VITE_SUPABASE_URL },
          ]}
        />
      </Card>
    </>
  );
};

export default SettingsPage;
