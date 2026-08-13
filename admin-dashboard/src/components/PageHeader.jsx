import { Calendar, ChevronDown, Download } from 'lucide-react';
import { useState } from 'react';
import { PRESETS, useRange } from '../context/RangeContext';
import { formatDate } from '../lib/format';

/** The date-range chip + preset dropdown from the reference's header row. */
export const RangeControls = () => {
  const { presetId, setPresetId, label, from, to, setCustom } = useRange();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  return (
    <>
      <span className="btn" style={{ cursor: 'default' }}>
        <Calendar size={15} />
        <span className="tiny">
          {formatDate(from)} - {formatDate(to)}
        </span>
      </span>

      <div className="menu-wrap">
        <button type="button" className="btn" onClick={() => setOpen((o) => !o)}>
          {label}
          <ChevronDown size={15} />
        </button>
        {open && (
          <div className="menu" style={{ minWidth: 240 }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="menu-item"
                onClick={() => {
                  setPresetId(preset.id);
                  setOpen(false);
                }}
                style={presetId === preset.id ? { color: 'var(--primary)', fontWeight: 600 } : undefined}
              >
                {preset.label}
              </button>
            ))}
            <div className="menu-header" style={{ borderTop: '1px solid var(--divider)', borderBottom: 'none', marginTop: 4 }}>
              <span className="micro-label">Custom range</span>
            </div>
            <div className="row" style={{ padding: '0 8px 8px', gap: 6 }}>
              <input
                type="date"
                className="input"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <input
                type="date"
                className="input"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!customFrom || !customTo}
                onClick={() => {
                  setCustom({ from: customFrom, to: `${customTo}T23:59:59` });
                  setOpen(false);
                }}
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const ExportButton = ({ onExport, disabled }) => (
  <button type="button" className="btn btn-primary" onClick={onExport} disabled={disabled}>
    <Download size={15} /> Export
  </button>
);

const PageHeader = ({ title, subtitle, showRange, actions }) => (
  <div className="page-header">
    <div className="col">
      <h1>{title}</h1>
      {subtitle && <span className="tiny muted">{subtitle}</span>}
    </div>
    <div className="page-header-actions">
      {showRange && <RangeControls />}
      {actions}
    </div>
  </div>
);

export default PageHeader;
