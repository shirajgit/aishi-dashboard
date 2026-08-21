// Hand-rolled SVG charts — no charting library, fully themeable.
import { useId } from 'react';

/** Smooth-ish area + line chart for a numeric series. */
export function AreaChart({ data, valueKey = 'mrr', height = 200, color = '#38d9f5' }) {
  const gid = useId();
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
        No revenue history yet
      </div>
    );
  }
  const w = 620;
  const h = height;
  const pad = { top: 16, right: 12, bottom: 26, left: 12 };
  const vals = data.map((d) => d[valueKey]);
  const max = Math.max(...vals) * 1.15;
  const min = Math.min(...vals) * 0.85;
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;

  const x = (i) => pad.left + (i / (data.length - 1)) * iw;
  const y = (v) => pad.top + ih - ((v - min) / (max - min || 1)) * ih;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[valueKey])}`).join(' ');
  const area = `${line} L ${x(data.length - 1)} ${pad.top + ih} L ${x(0)} ${pad.top + ih} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.left} x2={w - pad.right} y1={pad.top + ih * g} y2={pad.top + ih * g} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#grad-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d[valueKey])} r="3.5" fill="#02050f" stroke={color} strokeWidth="2" />
          <text x={x(i)} y={h - 8} textAnchor="middle" fontSize="11" fill="#5b6884">{d.month}</text>
        </g>
      ))}
    </svg>
  );
}

/** Horizontal bar list (leads by stage etc). */
export function BarList({ items, color = '#38d9f5' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it) => (
        <div key={it.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
            <span style={{ textTransform: 'capitalize' }}>{it.label}</span>
            <span className="mono muted">{it.display ?? it.value}</span>
          </div>
          <div className="progress">
            <span style={{ width: `${(it.value / max) * 100}%`, background: it.color || color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Donut chart with center label. */
export function Donut({ segments, size = 160, thickness = 20, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const cx = size / 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
        {centerLabel != null && (
          <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
            <text x={cx} y={cx - 2} textAnchor="middle" fontSize="22" fontWeight="700" fill="#e8edf7" fontFamily="Poppins, sans-serif">{centerLabel}</text>
            {centerSub && <text x={cx} y={cx + 16} textAnchor="middle" fontSize="10.5" fill="#8794ad">{centerSub}</text>}
          </g>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ textTransform: 'capitalize' }}>{s.label}</span>
            <span className="mono muted" style={{ marginLeft: 'auto', paddingLeft: 16 }}>{s.display ?? s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small sparkline used inside stat tiles. */
export function Sparkline({ values, color = '#38d9f5', width = 90, height = 30 }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
