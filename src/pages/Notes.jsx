import { useState } from 'react';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { fromNow } from '../lib/format';
import { Modal, Empty } from '../components/UI';
import { IconPlus, IconPin, IconTrash, IconEdit } from '../components/Icons';

const BLANK = { title: '', body: '', tags: [], pinned: false };

function NoteForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial, tagStr: (initial.tags || []).join(', ') });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal
      title={initial.id ? 'Edit note' : 'New note'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!form.title.trim()}
            onClick={() => onSave({ ...form, tags: form.tagStr.split(',').map((t) => t.trim()).filter(Boolean) })}
          >
            {initial.id ? 'Save' : 'Add note'}
          </button>
        </>
      }
    >
      <div className="field"><label>Title</label><input className="input" value={form.title} onChange={set('title')} placeholder="What is this about?" /></div>
      <div className="field"><label>Body</label><textarea className="textarea" style={{ minHeight: 140 }} value={form.body} onChange={set('body')} /></div>
      <div className="field"><label>Tags (comma separated)</label><input className="input" value={form.tagStr} onChange={set('tagStr')} placeholder="deal, tech, strategy" /></div>
    </Modal>
  );
}

export default function Notes() {
  const state = useDashboard();
  const [editing, setEditing] = useState(null);

  const notes = [...state.notes].sort((a, b) => (b.pinned - a.pinned) || (new Date(b.createdAt) - new Date(a.createdAt)));

  const save = (data) => {
    if (data.id) updateItem('notes', data.id, data);
    else addItem('notes', { ...data, createdAt: new Date().toISOString() });
    setEditing(null);
  };

  return (
    <>
      <div className="flex between mb-16">
        <span className="muted">{notes.length} notes · {notes.filter((n) => n.pinned).length} pinned</span>
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New note</button>
      </div>

      {notes.length === 0 ? (
        <div className="card"><Empty title="No notes yet" sub="Capture deal context, tech notes and strategy." action={<button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New note</button>} /></div>
      ) : (
        <div className="grid cols-3">
          {notes.map((n) => (
            <div key={n.id} className="card" style={n.pinned ? { borderColor: 'rgba(56,217,245,0.3)' } : undefined}>
              <div className="flex between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 15 }}>{n.title}</h3>
                <button className="icon-btn" onClick={() => updateItem('notes', n.id, { pinned: !n.pinned })} aria-label="Pin" style={{ color: n.pinned ? 'var(--cyan)' : undefined }}>
                  <IconPin size={15} fill={n.pinned ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{n.body}</p>
              <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                {n.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
              <div className="flex between">
                <span className="dim" style={{ fontSize: 11.5 }}>{fromNow(n.createdAt)}</span>
                <div className="flex gap-8">
                  <button className="icon-btn" onClick={() => setEditing(n)} aria-label="Edit"><IconEdit size={15} /></button>
                  <button className="icon-btn" onClick={() => removeItem('notes', n.id)} aria-label="Delete"><IconTrash size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <NoteForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
