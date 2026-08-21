import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { LEAD_STAGES, OPEN_STAGES, STAGE_COLORS } from '../lib/metrics';
import { money, compactMoney, dateShort, fromNow } from '../lib/format';
import { Badge, Avatar, Modal, Drawer, Empty } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconSend, IconPhone, IconMail } from '../components/Icons';

const BLANK = { name: '', company: '', email: '', phone: '', source: 'Website', status: 'new', value: 0, service: 'Website' };
const SOURCES = ['Website', 'Referral', 'Cold email', 'LinkedIn', 'Event', 'Other'];
const SERVICES = ['Website', 'Web App', 'Mobile App', 'E-commerce', 'AI / Automation', 'IoT', 'Digital Marketing', 'Other'];

function LeadForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.name.trim() && form.company.trim();

  return (
    <Modal
      title={initial.id ? 'Edit lead' : 'New lead'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave({ ...form, value: Number(form.value) || 0 })}>
            {initial.id ? 'Save changes' : 'Add lead'}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="field"><label>Contact name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Jane Doe" /></div>
        <div className="field"><label>Company *</label><input className="input" value={form.company} onChange={set('company')} placeholder="Acme Inc" /></div>
      </div>
      <div className="row">
        <div className="field"><label>Email</label><input className="input" value={form.email} onChange={set('email')} placeholder="jane@acme.com" /></div>
        <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 …" /></div>
      </div>
      <div className="row">
        <div className="field"><label>Source</label><select className="input" value={form.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label>Stage</label><select className="input" value={form.status} onChange={set('status')}>{LEAD_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="field"><label>Deal value (₹)</label><input className="input mono" type="number" value={form.value} onChange={set('value')} /></div>
        <div className="field"><label>Service</label><select className="input" value={form.service} onChange={set('service')}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
    </Modal>
  );
}

function LeadDrawer({ lead, onClose }) {
  const nav = useNavigate();
  return (
    <Drawer
      title={lead.name}
      subtitle={`${lead.company} · ${lead.source}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={() => nav('/outreach')}><IconSend size={15} /> Send outreach</button>
        </>
      }
    >
      <div className="flex gap-12 mb-16">
        <Avatar name={lead.name} size={48} />
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17 }}>{money(lead.value)}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>potential deal value</div>
        </div>
        <div style={{ marginLeft: 'auto' }}><Badge>{lead.status}</Badge></div>
      </div>

      <div className="section-title">Move to stage</div>
      <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
        {LEAD_STAGES.map((s) => (
          <button
            key={s}
            className="btn sm"
            style={s === lead.status ? { borderColor: STAGE_COLORS[s], color: STAGE_COLORS[s] } : undefined}
            onClick={() => updateItem('leads', lead.id, { status: s, lastContact: new Date().toISOString() })}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="section-title">Contact</div>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="flex gap-8" style={{ marginBottom: 8 }}><IconMail size={15} /> <span className="muted">{lead.email || '—'}</span></div>
        <div className="flex gap-8"><IconPhone size={15} /> <span className="muted">{lead.phone || '—'}</span></div>
      </div>

      <div className="section-title">Timeline</div>
      <div className="muted" style={{ fontSize: 13, lineHeight: 2 }}>
        <div>Created {fromNow(lead.createdAt)}</div>
        <div>Last contact {lead.lastContact ? fromNow(lead.lastContact) : 'never'}</div>
        <div>Service: {lead.service}</div>
      </div>
    </Drawer>
  );
}

export default function Leads() {
  const state = useDashboard();
  const [filter, setFilter] = useState('open');
  const [editing, setEditing] = useState(null); // lead object or BLANK
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => {
    let list = state.leads;
    if (filter === 'open') list = list.filter((l) => OPEN_STAGES.includes(l.status));
    else if (filter !== 'all') list = list.filter((l) => l.status === filter);
    return [...list].sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [state.leads, filter]);

  const totalValue = filtered.reduce((s, l) => s + (l.value || 0), 0);

  const save = (data) => {
    if (data.id) updateItem('leads', data.id, data);
    else addItem('leads', { ...data, createdAt: new Date().toISOString(), lastContact: null });
    setEditing(null);
  };

  return (
    <>
      <div className="flex between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="pill-tabs">
          {['open', 'all', ...LEAD_STAGES].map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="flex gap-12">
          <span className="muted" style={{ fontSize: 13 }}>{filtered.length} leads · <span className="mono">{compactMoney(totalValue)}</span></span>
          <button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New lead</button>
        </div>
      </div>

      <div className="card pad-0">
        {filtered.length === 0 ? (
          <Empty title="No leads here" sub="Add your first lead or switch filters." action={<button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New lead</button>} />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Lead</th><th>Stage</th><th>Service</th><th>Source</th><th className="right">Value</th><th>Last contact</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="clickable" onClick={() => setViewing(l)}>
                  <td>
                    <div className="person">
                      <Avatar name={l.name} />
                      <div><div className="name">{l.name}</div><div className="meta">{l.company}</div></div>
                    </div>
                  </td>
                  <td><Badge>{l.status}</Badge></td>
                  <td>{l.service ? <span className="tag">{l.service}</span> : <span className="dim">—</span>}</td>
                  <td className="muted">{l.source}</td>
                  <td className="right mono">{money(l.value)}</td>
                  <td className="muted">{l.lastContact ? fromNow(l.lastContact) : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-8">
                      <button className="icon-btn" onClick={() => setEditing(l)} aria-label="Edit"><IconEdit size={16} /></button>
                      <button className="icon-btn" onClick={() => removeItem('leads', l.id)} aria-label="Delete"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <LeadForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
      {viewing && <LeadDrawer lead={state.leads.find((l) => l.id === viewing.id) || viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
