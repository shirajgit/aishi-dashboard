import { useMemo, useState } from 'react';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { money, compactMoney, dateLong } from '../lib/format';
import { Badge, Avatar, Modal, Empty, Stat } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconWallet, IconHeart } from '../components/Icons';

const BLANK = { name: '', company: '', email: '', plan: 'Starter', mrr: 9000, status: 'trial', health: 70 };
const PLANS = { Starter: 9000, Pro: 22000, Growth: 45000 };
const STATUSES = ['active', 'trial', 'churned'];

function healthColor(h) {
  if (h >= 75) return '#4ade80';
  if (h >= 50) return '#f59e0b';
  return '#f43f5e';
}

function CustomerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setPlan = (e) => setForm({ ...form, plan: e.target.value, mrr: PLANS[e.target.value] });
  const valid = form.name.trim() && form.company.trim();

  return (
    <Modal
      title={initial.id ? 'Edit customer' : 'New customer'}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave({ ...form, mrr: Number(form.mrr) || 0, health: Number(form.health) })}>
            {initial.id ? 'Save' : 'Add customer'}
          </button>
        </>
      }
    >
      <div className="row">
        <div className="field"><label>Contact *</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="field"><label>Company *</label><input className="input" value={form.company} onChange={set('company')} /></div>
      </div>
      <div className="field"><label>Email</label><input className="input" value={form.email} onChange={set('email')} /></div>
      <div className="row">
        <div className="field"><label>Plan</label><select className="input" value={form.plan} onChange={setPlan}>{Object.keys(PLANS).map((p) => <option key={p}>{p}</option>)}</select></div>
        <div className="field"><label>MRR (₹)</label><input className="input mono" type="number" value={form.mrr} onChange={set('mrr')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Status</label><select className="input" value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="field"><label>Health score ({form.health})</label><input type="range" min="0" max="100" value={form.health} onChange={set('health')} style={{ accentColor: '#38d9f5' }} /></div>
      </div>
    </Modal>
  );
}

export default function Customers() {
  const state = useDashboard();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const term = q.toLowerCase();
    return state.customers
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term))
      .sort((a, b) => b.mrr - a.mrr);
  }, [state.customers, q]);

  const active = state.customers.filter((c) => c.status === 'active');
  const totalMrr = active.reduce((s, c) => s + c.mrr, 0);
  const avgHealth = state.customers.length ? Math.round(state.customers.reduce((s, c) => s + c.health, 0) / state.customers.length) : 0;

  const save = (data) => {
    if (data.id) updateItem('customers', data.id, data);
    else addItem('customers', { ...data, since: new Date().toISOString() });
    setEditing(null);
  };

  return (
    <>
      <div className="grid cols-3 mb-16">
        <Stat icon={<IconUsers size={19} />} label="Active customers" value={active.length} foot={`${state.customers.length} total accounts`} />
        <Stat icon={<IconWallet size={19} />} label="Total MRR" value={compactMoney(totalMrr)} foot={`avg ${compactMoney(active.length ? totalMrr / active.length : 0)} / account`} />
        <Stat icon={<IconHeart size={19} />} label="Avg. health" value={`${avgHealth}%`} foot="across all accounts" />
      </div>

      <div className="flex between mb-16">
        <div className="search" style={{ margin: 0, width: 280 }}>
          <input placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn primary" onClick={() => setEditing({ ...BLANK })}><IconPlus size={16} /> New customer</button>
      </div>

      <div className="card pad-0">
        {list.length === 0 ? (
          <Empty title="No customers found" />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Plan</th><th className="right">MRR</th><th>Status</th><th style={{ width: 160 }}>Health</th><th>Since</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="person">
                      <Avatar name={c.name} />
                      <div><div className="name">{c.name}</div><div className="meta">{c.company}</div></div>
                    </div>
                  </td>
                  <td><span className="tag">{c.plan}</span></td>
                  <td className="right mono">{money(c.mrr)}</td>
                  <td><Badge>{c.status}</Badge></td>
                  <td>
                    <div className="flex gap-8">
                      <div className="progress" style={{ flex: 1 }}><span style={{ width: `${c.health}%`, background: healthColor(c.health) }} /></div>
                      <span className="mono muted" style={{ fontSize: 12, width: 30 }}>{c.health}</span>
                    </div>
                  </td>
                  <td className="muted">{dateLong(c.since)}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="icon-btn" onClick={() => setEditing(c)} aria-label="Edit"><IconEdit size={16} /></button>
                      <button className="icon-btn" onClick={() => removeItem('customers', c.id)} aria-label="Delete"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <CustomerForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
