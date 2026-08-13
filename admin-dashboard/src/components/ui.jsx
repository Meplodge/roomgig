import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  Star,
  X,
} from 'lucide-react';
import { formatNumber, formatPercent, initials } from '../lib/format';

/* ------------------------------------------------------------------- card */

export const Card = ({ title, subtitle, actions, children, className = '', ...rest }) => (
  <section className={`card ${className}`} {...rest}>
    {(title || actions) && (
      <header className="card-head">
        <div className="col">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <span className="tiny muted">{subtitle}</span>}
        </div>
        {actions && <div className="card-head-actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

/* -------------------------------------------------------------- delta pill */

export const DeltaPill = ({ value, suffix = '' }) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  const direction = numeric > 0.05 ? 'up' : numeric < -0.05 ? 'down' : 'flat';
  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : null;
  return (
    <span className={`delta-pill ${direction}`}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {formatPercent(Math.abs(numeric))}
      {suffix}
    </span>
  );
};

/* -------------------------------------------------------------- stat card */

export const StatCard = ({ label, value, icon: Icon, delta, caption, loading }) => (
  <div className="stat-card">
    <div className="stat-card-head">
      <span className="stat-card-label">{label}</span>
      {Icon && (
        <span className="stat-card-icon">
          <Icon size={17} strokeWidth={2} />
        </span>
      )}
    </div>
    {loading ? (
      <div className="skeleton" style={{ height: 32, width: '65%' }} />
    ) : (
      <div className="stat-card-value-row">
        <span className="stat-card-value">{value}</span>
        <DeltaPill value={delta} />
      </div>
    )}
    {caption && <span className="stat-card-caption">{caption}</span>}
  </div>
);

/* ----------------------------------------------------------------- badges */

const STATUS_TONES = {
  active: 'success',
  completed: 'success',
  confirmed: 'success',
  verified: 'success',
  pending: 'warning',
  inactive: 'neutral',
  expired: 'neutral',
  deleted: 'error',
  cancelled: 'error',
  failed: 'error',
  refunded: 'info',
  sold: 'info',
  rented: 'info',
  suspended: 'error',
  super_admin: 'primary',
  admin: 'primary',
  moderator: 'info',
  analyst: 'neutral',
  host: 'info',
  agent: 'info',
  user: 'neutral',
};

export const StatusBadge = ({ status, label }) => {
  const key = String(status || '').toLowerCase();
  const tone = STATUS_TONES[key] || 'neutral';
  return (
    <span className={`badge badge-${tone}`}>{label || String(status || '--').replace(/_/g, ' ')}</span>
  );
};

export const Avatar = ({ url, name, email, size = 32 }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {url ? <img src={url} alt="" loading="lazy" /> : initials(name, email)}
  </span>
);

export const Stars = ({ rating, count }) => (
  <span className="stars">
    <Star size={13} fill="currentColor" strokeWidth={0} />
    {Number(rating || 0).toFixed(1)}
    {count !== undefined && <span className="tiny muted">({formatNumber(count)})</span>}
  </span>
);

/* ------------------------------------------------------------ empty/error */

export const EmptyState = ({ title = 'Nothing here yet', message, icon: Icon = Inbox }) => (
  <div className="state-block">
    <span className="state-icon">
      <Icon size={20} />
    </span>
    <strong>{title}</strong>
    {message && <span className="tiny">{message}</span>}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="state-block error">
    <span className="state-icon">
      <AlertCircle size={20} />
    </span>
    <strong>Something went wrong</strong>
    <span className="tiny">{error?.message || String(error)}</span>
    {onRetry && (
      <button type="button" className="btn btn-sm" onClick={onRetry} style={{ marginTop: 8 }}>
        Try again
      </button>
    )}
  </div>
);

export const Skeleton = ({ height = 16, width = '100%', style }) => (
  <div className="skeleton" style={{ height, width, ...style }} />
);

export const TableSkeleton = ({ rows = 6, columns = 5 }) => (
  <div className="table-wrap">
    <table className="data">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((__, c) => (
              <td key={c}>
                <Skeleton height={14} width={c === 0 ? '70%' : '45%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------- data table */

/**
 * columns: [{ key, label, align, sortable, render(row), width }]
 */
export const DataTable = ({
  columns,
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  sort,
  onSortChange,
  emptyTitle,
  emptyMessage,
  rowKey = (row) => row.id,
}) => {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading) return <TableSkeleton columns={columns.length} />;
  if (!rows?.length) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  const handleSort = (column) => {
    if (!column.sortable || !onSortChange) return;
    const isCurrent = sort?.key === column.key;
    onSortChange({ key: column.key, dir: isCurrent && sort.dir === 'desc' ? 'asc' : 'desc' });
  };

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${column.align === 'right' ? 'text-right' : ''} ${
                  column.sortable ? 'sortable' : ''
                }`}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => handleSort(column)}
              >
                <span className="th-inner">
                  {column.label}
                  {sort?.key === column.key &&
                    (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'right' ? 'text-right' : ''}>
                  {column.render ? column.render(row) : row[column.key] ?? '--'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ------------------------------------------------------------- pagination */

export const Pagination = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const pages = Math.max(Math.ceil((total || 0) / pageSize), 1);
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total || 0);

  return (
    <div className="pagination">
      <span className="page-info">
        {formatNumber(start)}-{formatNumber(end)} of {formatNumber(total || 0)}
      </span>
      {onPageSizeChange && (
        <select
          className="select btn-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      )}
      <div className="spacer" />
      <button
        type="button"
        className="btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <span className="page-info">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="btn btn-sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ modal */

export const Modal = ({ title, children, onClose, actions, wide }) => {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="row-between">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
};

/**
 * Confirmation dialog. When requireReason is set the confirm button stays
 * disabled until a reason is typed - that reason lands in the audit log.
 * When confirmWord is set the admin must type it exactly (used for deletes).
 */
export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  requireReason,
  confirmWord,
  busy,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');

  const reasonOk = !requireReason || reason.trim().length >= 3;
  const wordOk = !confirmWord || typed.trim() === confirmWord;
  const canConfirm = reasonOk && wordOk && !busy;

  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy && <span className="spinner" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="muted">{message}</p>}
      {requireReason && (
        <div className="field">
          <label htmlFor="confirm-reason">Reason (recorded in the audit log)</label>
          <textarea
            id="confirm-reason"
            className="textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you taking this action?"
            autoFocus
          />
        </div>
      )}
      {confirmWord && (
        <div className="field">
          <label htmlFor="confirm-word">
            Type <strong>{confirmWord}</strong> to confirm
          </label>
          <input
            id="confirm-word"
            className="input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------- tabs */

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        className={`tab ${active === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
        {tab.count !== undefined && <span className="muted"> ({formatNumber(tab.count)})</span>}
      </button>
    ))}
  </div>
);

/* ---------------------------------------------------------- search input */

export const SearchInput = ({ value, onChange, placeholder = 'Search...', delay = 350 }) => {
  const [local, setLocal] = useState(value || '');
  const timer = useRef(null);

  // Keep in sync when the parent resets filters.
  useEffect(() => setLocal(value || ''), [value]);

  const handle = (next) => {
    setLocal(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), delay);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="search-inline">
      <Search size={15} />
      <input
        className="input"
        value={local}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

/* ------------------------------------------------------------ definition */

export const KeyValue = ({ items }) => (
  <dl className="kv">
    {items
      .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
      .map((item) => (
        <div key={item.label} style={{ display: 'contents' }}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
  </dl>
);
