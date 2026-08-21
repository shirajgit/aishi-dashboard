import { useEffect } from 'react';
import { IconX } from './Icons';
import { initials, hueFor } from '../lib/format';
import { STAGE_COLORS, STATUS_COLORS } from '../lib/metrics';

export function Badge({ children, color }) {
  const c = color || STAGE_COLORS[children] || STATUS_COLORS[children] || '#8794ad';
  return (
    <span className="badge" style={{ background: `${c}1f`, color: c }}>
      <span className="dot" style={{ background: c }} />
      {children}
    </span>
  );
}

export function Avatar({ name, size = 34 }) {
  const hue = hueFor(name);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 55% 22%)`,
        color: `hsl(${hue} 85% 72%)`,
        border: `1px solid hsl(${hue} 55% 34%)`,
      }}
    >
      {initials(name)}
    </div>
  );
}

export function Stat({ icon, label, value, delta, deltaDir, foot }) {
  return (
    <div className="card stat">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="label">{label}</div>
      <div className="value mono">{value}</div>
      {delta != null && (
        <div className={`delta ${deltaDir === 'down' ? 'down' : 'up'}`}>
          {deltaDir === 'down' ? '▼' : '▲'} {delta}
          {foot && <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>{foot}</span>}
        </div>
      )}
      {delta == null && foot && <div className="muted" style={{ fontSize: 12 }}>{foot}</div>}
    </div>
  );
}

export function Empty({ title = 'Nothing here yet', sub, action }) {
  return (
    <div className="empty">
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
      {sub && <div style={{ marginBottom: 16 }}>{sub}</div>}
      {action}
    </div>
  );
}

function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
}

export function Modal({ title, onClose, children, footer, wide }) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 720 } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><IconX size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ title, subtitle, onClose, children, footer }) {
  useLockScroll();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><IconX size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
