import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { formatCompact, formatNumber } from '../lib/format';

/**
 * Recharts needs real colour values, not var(--x) references, so read the
 * resolved custom properties and recompute whenever the theme flips.
 */
export const useChartColors = () => {
  const { theme } = useTheme();
  const [colors, setColors] = useState({});

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    setColors({
      chart1: read('--chart-1'),
      chart2: read('--chart-2'),
      chart3: read('--chart-3'),
      chart4: read('--chart-4'),
      chart5: read('--chart-5'),
      grid: read('--chart-grid'),
      muted: read('--chart-muted'),
      text: read('--text-secondary'),
      primary: read('--primary'),
      surface: read('--surface'),
    });
  }, [theme]);

  return colors;
};

const bucketLabel = (value, bucket) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (bucket === 'hour') return date.toLocaleTimeString('en-US', { hour: 'numeric' });
  if (bucket === 'month') return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChartTooltip = ({ active, payload, label, bucket, valueFormatter, labels }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{bucketLabel(label, bucket)}</div>
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey}>
          <span className="chart-tooltip-swatch" style={{ background: entry.stroke || entry.fill }} />
          {labels?.[entry.dataKey] || entry.dataKey}:{' '}
          <strong style={{ color: 'var(--text)' }}>
            {valueFormatter ? valueFormatter(entry.value) : formatNumber(entry.value)}
          </strong>
        </div>
      ))}
    </div>
  );
};

/**
 * Area chart with an optional dashed "previous period" overlay, matching the
 * comparison tooltip in the reference design.
 */
export const TrendChart = ({
  data,
  bucket = 'day',
  height = 200,
  valueFormatter,
  showPrevious = true,
  labels = { value: 'This period', previous: 'Previous period' },
}) => {
  const colors = useChartColors();

  if (!data?.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        No data for this period
      </div>
    );
  }

  const hasPrevious = showPrevious && data.some((d) => d.previous !== undefined);

  return (
    <div className="chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.chart1} stopOpacity={0.28} />
              <stop offset="100%" stopColor={colors.chart1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={(value) => bucketLabel(value, bucket)}
            tick={{ fill: colors.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: colors.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip bucket={bucket} valueFormatter={valueFormatter} labels={labels} />}
          />
          {hasPrevious && (
            <Area
              type="monotone"
              dataKey="previous"
              stroke={colors.muted}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.chart1}
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Bars + an overlaid line, used for bookings vs revenue. */
export const ComboChart = ({ data, bucket = 'day', height = 240, valueFormatter, labels }) => {
  const colors = useChartColors();
  if (!data?.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        No data for this period
      </div>
    );
  }

  return (
    <div className="chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={(value) => bucketLabel(value, bucket)}
            tick={{ fill: colors.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: colors.text, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: colors.muted, opacity: 0.35 }}
            content={<ChartTooltip bucket={bucket} valueFormatter={valueFormatter} labels={labels} />}
          />
          <Bar dataKey="value" fill={colors.chart1} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line type="monotone" dataKey="previous" stroke={colors.chart3} strokeWidth={2} dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DonutChart = ({ data, height = 220, valueFormatter }) => {
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5];
  const rows = (data || []).filter((d) => Number(d.value) > 0);

  if (!rows.length) {
    return (
      <div className="chart-empty" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <div className="chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="none"
          >
            {rows.map((row, index) => (
              <Cell key={row.label} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              valueFormatter ? valueFormatter(value) : formatNumber(value),
              String(name).replace(/_/g, ' '),
            ]}
            contentStyle={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(value) => (
              <span style={{ color: colors.text, fontSize: 12 }}>
                {String(value).replace(/_/g, ' ')}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Horizontal bars for ranked lists (top cities, top searches). */
export const RankedBars = ({ data, valueFormatter = formatNumber }) => {
  const rows = data || [];
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);

  if (!rows.length) return <div className="chart-empty" style={{ height: 120 }}>No data</div>;

  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      {rows.map((row) => (
        <div key={row.label} className="col" style={{ gap: 6 }}>
          <div className="row-between">
            <span className="truncate">{row.label}</span>
            <span className="tiny muted num">{valueFormatter(row.value)}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.max((Number(row.value) / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Day-of-week bars with the peak highlighted, mirroring the reference's
 * "Most Day Active" card. Built with divs so the peak label sits above the bar.
 */
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WeekdayBars = ({ data }) => {
  const rows = DAY_LABELS.map((label, index) => {
    const match = (data || []).find((d) => Number(d.weekday) === index);
    return { label, value: Number(match?.value) || 0 };
  });

  const max = Math.max(...rows.map((r) => r.value), 1);
  const peakIndex = rows.reduce((best, row, i) => (row.value > rows[best].value ? i : best), 0);
  const hasData = rows.some((r) => r.value > 0);

  return (
    <div className="weekday-chart">
      {rows.map((row, index) => {
        const isPeak = hasData && index === peakIndex;
        return (
          <div key={row.label} className={`weekday-col ${isPeak ? 'peak' : ''}`}>
            {isPeak && <span className="weekday-peak-value">{formatNumber(row.value)}</span>}
            <div
              className="weekday-bar"
              style={{ height: `${Math.max((row.value / max) * 100, 3)}%` }}
              title={`${row.label}: ${formatNumber(row.value)}`}
            />
            <span className="weekday-label">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Semicircular gauge built from an SVG arc, matching the reference's
 * "Repeat Customer Rate" card.
 */
export const Gauge = ({ value = 0, target, caption, size = 176 }) => {
  const colors = useChartColors();
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);

  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;

  const arc = (r) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="gauge">
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={arc(radius)}
          fill="none"
          stroke={colors.muted}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={arc(radius)}
          fill="none"
          stroke={colors.chart1}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="col" style={{ alignItems: 'center', marginTop: -34 }}>
        <span className="gauge-value">{pct.toFixed(0)}%</span>
        {caption && <span className="tiny muted">{caption}</span>}
        {target !== undefined && (
          <span className="tiny muted">
            {pct >= target ? 'On track for' : 'Below'} {target}% target
          </span>
        )}
      </div>
    </div>
  );
};

/** The 3-up split card from the reference ("Customers"). */
export const SegmentBar = ({ title, segments }) => {
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart3, colors.chart5];

  return (
    <div className="segment-bar">
      {title && <span className="micro-label">{title}</span>}
      <div className="segment-row">
        {segments.map((segment, index) => (
          <div className="segment" key={segment.label}>
            <span className="segment-value">
              {segment.icon && (
                <segment.icon size={15} color={palette[index % palette.length]} strokeWidth={2.2} />
              )}
              {formatNumber(segment.value)}
            </span>
            <span className="tiny muted">{segment.label}</span>
            <span
              className="segment-underline"
              style={{ background: palette[index % palette.length] }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
