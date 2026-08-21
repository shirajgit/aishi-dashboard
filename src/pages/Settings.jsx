import { useState } from 'react';
import { useDashboard, resetData, clearData, exportData } from '../store/db';
import { IconDownload, IconRefresh, IconTrash } from '../components/Icons';

export default function Settings() {
  const state = useDashboard();
  const [confirm, setConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const counts = [
    ['Leads', state.leads.length],
    ['Customers', state.customers.length],
    ['Subscriptions', state.subscriptions.length],
    ['Outbox messages', state.outbox.length],
    ['Notes', state.notes.length],
    ['Actions', state.actions.length],
  ];

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aishi-dashboard-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-head"><h3>Data store</h3><span className="hint">Neon Postgres</span></div>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginTop: 0 }}>
          Data is stored in a Neon Postgres database via a Prisma + Express API, in a dedicated
          <code> aishi_dashboard</code> schema. Export a snapshot or reset to the demo dataset anytime.
        </p>
        <div className="divider" />
        {counts.map(([label, n]) => (
          <div key={label} className="flex between" style={{ padding: '7px 0' }}>
            <span className="muted">{label}</span>
            <span className="mono" style={{ fontWeight: 600 }}>{n}</span>
          </div>
        ))}
        <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={download}><IconDownload size={16} /> Export JSON</button>
          <button className="btn danger" onClick={() => { setClearConfirm(true); setConfirm(false); }}><IconTrash size={16} /> Clear all data</button>
          <button className="btn ghost" onClick={() => { setConfirm(true); setClearConfirm(false); }}><IconRefresh size={16} /> Load demo data</button>
        </div>
        {clearConfirm && (
          <div className="card mt-16" style={{ background: 'var(--bg-2)', borderColor: 'var(--red)' }}>
            <p style={{ marginTop: 0, fontSize: 13 }}>Permanently delete all leads, customers, subscriptions, outbox messages, notes and actions from the database? Outreach templates are kept. This can’t be undone.</p>
            <div className="flex gap-8">
              <button className="btn ghost sm" onClick={() => setClearConfirm(false)}>Cancel</button>
              <button className="btn danger sm" onClick={() => { clearData(); setClearConfirm(false); }}>Yes, delete everything</button>
            </div>
          </div>
        )}
        {confirm && (
          <div className="card mt-16" style={{ background: 'var(--bg-2)', borderColor: 'var(--amber)' }}>
            <p style={{ marginTop: 0, fontSize: 13 }}>This replaces everything with the original demo seed data. Continue?</p>
            <div className="flex gap-8">
              <button className="btn ghost sm" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn sm" onClick={() => { resetData(); setConfirm(false); }}>Yes, load demo</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><h3>About</h3></div>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.8, marginTop: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Aishi Operations</strong> is the internal command
          center for Aishi Technologies — pipeline, customers, recurring revenue, cold outreach,
          notes and next actions in one place.
        </p>
        <div className="divider" />
        <div className="flex between" style={{ padding: '6px 0' }}><span className="muted">Version</span><span className="mono">0.1.0</span></div>
        <div className="flex between" style={{ padding: '6px 0' }}><span className="muted">Stack</span><span>React · Vite · Express · Prisma</span></div>
        <div className="flex between" style={{ padding: '6px 0' }}><span className="muted">Persistence</span><span>Neon Postgres</span></div>
        <div className="divider" />
        <p className="dim" style={{ fontSize: 12, lineHeight: 1.6 }}>
          To wire real email delivery, replace the “Send now” handler in <code>Outreach.jsx</code>
          with a call to your provider (Resend / SendGrid / SMTP) behind a small backend endpoint.
        </p>
      </div>
    </div>
  );
}
