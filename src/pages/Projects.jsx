import { useState } from 'react';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { money, compactMoney, dateShort } from '../lib/format';
import { Modal, Empty, Avatar } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconClock } from '../components/Icons';

const SERVICES = ['Website', 'Web App', 'Mobile App', 'E-commerce', 'AI / Automation', 'IoT', 'Digital Marketing', 'Other'];

// The three onboarding columns, in order.
const COLUMNS = [
  { key: 'not-started', label: 'Not started', color: '#94a3b8' },
  { key: 'pending', label: 'Pending', color: '#f59e0b' },
  { key: 'completed', label: 'Completed', color: '#4ade80' },
];
const ORDER = COLUMNS.map((c) => c.key);

const BLANK = { title: '', client: '', service: 'Website', status: 'not-started', value: 0, deadline: '', notes: '' };

function ProjectForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial, deadline: initial.deadline ? initial.deadline.slice(0, 10) : '' });
  // "Other" = client not in the existing customer/lead list (type it manually).
  const [custom, setCustom] = useState(!!initial.client && !clients.includes(initial.client));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.title.trim() && form.client.trim();

  const onPickClient = (e) => {
    const v = e.target.value;
    if (v === '__other__') { setCustom(true); setForm({ ...form, client: '' }); }
    else { setCustom(false); setForm({ ...form, client: v }); }
  };

  return (
    <Modal
      title={initial.id ? 'Edit project' : 'New project'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => onSave({
              ...form,
              value: Number(form.value) || 0,
              deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
            })}
          >
            {initial.id ? 'Save' : 'Add project'}
          </button>
        </>
      }
    >
      <div className="field"><label>Project title *</label><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Custom website for Acme" /></div>
      <div className="field">
        <label>Client *</label>
        <select className="input" value={custom ? '__other__' : form.client} onChange={onPickClient}>
          <option value="">— select client —</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__other__">+ Other (type manually)</option>
        </select>
        {custom && <input className="input" style={{ marginTop: 8 }} value={form.client} onChange={set('client')} placeholder="Client / company name" autoFocus />}
      </div>
      <div className="row">
        <div className="field"><label>Service</label><select className="input" value={form.service} onChange={set('service')}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label>Status</label><select className="input" value={form.status} onChange={set('status')}>{COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="field"><label>Deal value (₹)</label><input className="input mono" type="number" value={form.value} onChange={set('value')} /></div>
        <div className="field"><label>Deadline</label><input className="input" type="date" value={form.deadline} onChange={set('deadline')} /></div>
      </div>
      <div className="field"><label>Notes</label><textarea className="textarea" value={form.notes} onChange={set('notes')} placeholder="Scope, milestones, blockers…" /></div>
    </Modal>
  );
}

function Card({ p, onEdit }) {
  const idx = ORDER.indexOf(p.status);
  const overdue = p.deadline && p.status !== 'completed' && new Date(p.deadline) < new Date(new Date().toDateString());
  const move = (dir) => {
    const next = ORDER[idx + dir];
    if (next) updateItem('projects', p.id, { status: next });
  };
  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <div className="flex between" style={{ gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>{p.title}</div>
        <div className="flex gap-8">
          <button className="icon-btn" onClick={() => onEdit(p)} aria-label="Edit"><IconEdit size={14} /></button>
          <button className="icon-btn" onClick={() => removeItem('projects', p.id)} aria-label="Delete"><IconTrash size={14} /></button>
        </div>
      </div>
      <div className="person" style={{ marginBottom: 10 }}>
        <Avatar name={p.client} size={26} />
        <div className="meta" style={{ fontSize: 12.5 }}>{p.client}</div>
      </div>
      <div className="flex between" style={{ marginBottom: 10 }}>
        <span className="tag">{p.service}</span>
        <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{compactMoney(p.value)}</span>
      </div>
      {p.deadline && (
        <div className="flex gap-8" style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text-dim)', marginBottom: 10 }}>
          <IconClock size={13} /> {overdue ? 'Overdue · ' : 'Due '}{dateShort(p.deadline)}
        </div>
      )}
      <div className="flex between">
        <button className="btn ghost sm" disabled={idx === 0} onClick={() => move(-1)}>‹ Back</button>
        <button className="btn ghost sm" disabled={idx === ORDER.length - 1} onClick={() => move(1)}>Next ›</button>
      </div>
    </div>
  );
}

export default function Projects() {
  const state = useDashboard();
  const [editing, setEditing] = useState(null);

  const projects = state.projects || [];

  // Existing clients to pick from: unique company (or name) across customers + leads.
  const clients = Array.from(
    new Set([
      ...state.customers.map((c) => c.company || c.name),
      ...state.leads.map((l) => l.company || l.name),
    ].filter(Boolean)),
  ).sort();

  const save = (data) => {
    if (data.id) updateItem('projects', data.id, data);
    else addItem('projects', { ...data, createdAt: new Date().toISOString() });
    setEditing(null);
  };

  return (
    <>
      <div className="flex between mb-16">
        <span className="muted">{projects.length} projects · {projects.filter((p) => p.status !== 'completed').length} active</span>
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <Empty
            title="No projects yet"
            sub="Signed a client? Add the project and track it from Not started → Pending → Completed."
            action={<button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New project</button>}
          />
        </div>
      ) : (
        <div className="board">
          {COLUMNS.map((col) => {
            const items = projects.filter((p) => p.status === col.key);
            const total = items.reduce((s, p) => s + (p.value || 0), 0);
            return (
              <div key={col.key} className="board-col">
                <div className="board-col-head">
                  <span className="flex gap-8" style={{ fontWeight: 600, fontSize: 13 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.color }} />
                    {col.label}
                    <span className="nav-badge">{items.length}</span>
                  </span>
                  <span className="mono dim" style={{ fontSize: 11.5 }}>{compactMoney(total)}</span>
                </div>
                {items.length === 0 ? (
                  <div className="board-empty">Drop projects here</div>
                ) : (
                  items.map((p) => <Card key={p.id} p={p} onEdit={setEditing} />)
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && <ProjectForm initial={editing} clients={clients} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
