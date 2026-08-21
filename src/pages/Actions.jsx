import { useMemo, useState } from 'react';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { dateShort } from '../lib/format';
import { Badge, Modal, Empty } from '../components/UI';
import { IconPlus, IconTrash, IconClock } from '../components/Icons';

const BLANK = { title: '', due: new Date().toISOString().slice(0, 10), priority: 'medium', done: false, relatedType: '', relatedId: '' };
const PRIO_COLOR = { high: '#f43f5e', medium: '#f59e0b', low: '#94a3b8' };

function ActionForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal
      title="New action"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!form.title.trim()} onClick={() => onSave(form)}>Add action</button>
        </>
      }
    >
      <div className="field"><label>Task</label><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Follow up with…" /></div>
      <div className="row">
        <div className="field"><label>Due date</label><input className="input" type="date" value={form.due} onChange={set('due')} /></div>
        <div className="field"><label>Priority</label><select className="input" value={form.priority} onChange={set('priority')}><option>high</option><option>medium</option><option>low</option></select></div>
      </div>
    </Modal>
  );
}

export default function Actions() {
  const state = useDashboard();
  const [editing, setEditing] = useState(null);
  const [showDone, setShowDone] = useState(false);

  const { overdue, today, upcoming, done } = useMemo(() => {
    const startToday = new Date(new Date().toDateString());
    const endToday = new Date(startToday.getTime() + 86400000);
    const buckets = { overdue: [], today: [], upcoming: [], done: [] };
    [...state.actions]
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .forEach((a) => {
        if (a.done) return buckets.done.push(a);
        const d = new Date(a.due);
        if (d < startToday) buckets.overdue.push(a);
        else if (d < endToday) buckets.today.push(a);
        else buckets.upcoming.push(a);
      });
    return buckets;
  }, [state.actions]);

  const save = (data) => {
    addItem('actions', { ...data, due: new Date(data.due).toISOString() });
    setEditing(null);
  };

  const Row = ({ a }) => (
    <div className="flex gap-12" style={{ padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <button className={`checkbox ${a.done ? 'on' : ''}`} onClick={() => updateItem('actions', a.id, { done: !a.done })} aria-label="Toggle">
        {a.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
      </button>
      <span style={{ flex: 1, textDecoration: a.done ? 'line-through' : 'none', color: a.done ? 'var(--text-dim)' : undefined }}>{a.title}</span>
      <Badge color={PRIO_COLOR[a.priority]}>{a.priority}</Badge>
      <span className="muted flex gap-8" style={{ fontSize: 12.5, minWidth: 74, justifyContent: 'flex-end' }}><IconClock size={13} /> {dateShort(a.due)}</span>
      <button className="icon-btn" onClick={() => removeItem('actions', a.id)} aria-label="Delete"><IconTrash size={15} /></button>
    </div>
  );

  const Section = ({ title, items, color }) =>
    items.length > 0 && (
      <div className="card mb-16">
        <div className="card-head"><h3 style={{ fontSize: 14, color }}>{title} <span className="muted" style={{ fontWeight: 400 }}>· {items.length}</span></h3></div>
        {items.map((a) => <Row key={a.id} a={a} />)}
      </div>
    );

  const openCount = overdue.length + today.length + upcoming.length;

  return (
    <>
      <div className="flex between mb-16">
        <span className="muted">{openCount} open · {overdue.length} overdue · {done.length} done</span>
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New action</button>
      </div>

      {openCount === 0 && !showDone && (
        <div className="card"><Empty title="You're all caught up 🎉" sub="No open actions right now." action={<button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New action</button>} /></div>
      )}

      <Section title="Overdue" items={overdue} color="#f43f5e" />
      <Section title="Due today" items={today} color="#f59e0b" />
      <Section title="Upcoming" items={upcoming} color="#38d9f5" />

      {done.length > 0 && (
        <>
          <button className="btn ghost sm" onClick={() => setShowDone((s) => !s)} style={{ marginBottom: 12 }}>
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </button>
          {showDone && <div className="card">{done.map((a) => <Row key={a.id} a={a} />)}</div>}
        </>
      )}

      {editing && <ActionForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
