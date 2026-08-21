import { useState } from 'react';
import { useDashboard, addItem, updateItem, removeItem } from '../store/db';
import { fromNow } from '../lib/format';
import { Badge, Empty } from '../components/UI';
import { IconSend, IconMail, IconChat, IconTrash } from '../components/Icons';

function fillTemplate(text, lead) {
  if (!lead) return text;
  return text
    .replaceAll('{{name}}', lead.name.split(' ')[0])
    .replaceAll('{{company}}', lead.company);
}

export default function Outreach() {
  const state = useDashboard();
  const [channel, setChannel] = useState('email');
  const [leadId, setLeadId] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toast, setToast] = useState('');

  const templates = state.templates.filter((t) => t.channel === channel);
  const lead = state.leads.find((l) => l.id === leadId);

  const pickLead = (id) => {
    setLeadId(id);
    const l = state.leads.find((x) => x.id === id);
    if (l) setTo(channel === 'email' ? l.email : l.phone);
    if (l) {
      setSubject((s) => fillTemplate(s, l));
      setBody((b) => fillTemplate(b, l));
    }
  };

  const applyTemplate = (t) => {
    setSubject(fillTemplate(t.subject, lead));
    setBody(fillTemplate(t.body, lead));
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const reset = () => { setTo(''); setSubject(''); setBody(''); setLeadId(''); };

  const commit = (status) => {
    if (!to.trim() || !body.trim()) return flash('Add a recipient and a message first.');
    addItem('outbox', {
      channel, to, leadId: leadId || null, subject, body,
      status, createdAt: new Date().toISOString(), sentAt: status === 'sent' ? new Date().toISOString() : null,
    });
    // Advance a fresh lead to "contacted" when we actually send.
    if (status === 'sent' && lead && lead.status === 'new') {
      updateItem('leads', lead.id, { status: 'contacted', lastContact: new Date().toISOString() });
    } else if (status === 'sent' && lead) {
      updateItem('leads', lead.id, { lastContact: new Date().toISOString() });
    }
    flash(status === 'sent' ? `Sent to ${to} — logged in Outbox.` : 'Saved as draft.');
    reset();
  };

  const outbox = [...state.outbox].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 200, background: 'var(--panel)', border: '1px solid var(--cyan)', color: 'var(--cyan)', padding: '11px 16px', borderRadius: 12, boxShadow: 'var(--shadow)', fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr', alignItems: 'start' }}>
        {/* Composer */}
        <div className="card">
          <div className="card-head"><h3>Compose</h3>
            <div className="pill-tabs">
              <button className={channel === 'email' ? 'active' : ''} onClick={() => setChannel('email')}><IconMail size={13} /> Email</button>
              <button className={channel === 'whatsapp' ? 'active' : ''} onClick={() => setChannel('whatsapp')}><IconChat size={13} /> WhatsApp</button>
            </div>
          </div>

          <div className="field">
            <label>Recipient lead</label>
            <select className="input" value={leadId} onChange={(e) => pickLead(e.target.value)}>
              <option value="">— manual entry —</option>
              {state.leads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.company}</option>)}
            </select>
          </div>

          <div className="field">
            <label>{channel === 'email' ? 'To (email)' : 'To (phone)'}</label>
            <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder={channel === 'email' ? 'name@company.com' : '+91 …'} />
          </div>

          {channel === 'email' && (
            <div className="field"><label>Subject</label><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick idea for…" /></div>
          )}

          <div className="field">
            <label>Message · variables: <code style={{ color: 'var(--cyan)' }}>{'{{name}} {{company}}'}</code></label>
            <textarea className="textarea" style={{ minHeight: 150 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
          </div>

          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={() => commit('draft')}>Save draft</button>
            <button className="btn primary" onClick={() => commit('sent')}><IconSend size={15} /> Send now</button>
          </div>
        </div>

        {/* Templates + preview */}
        <div>
          <div className="card mb-16">
            <div className="card-head"><h3>Templates</h3><span className="hint">{channel}</span></div>
            {templates.map((t) => (
              <div key={t.id} className="flex between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{(t.subject || t.body).slice(0, 46)}…</div>
                </div>
                <button className="btn ghost sm" onClick={() => applyTemplate(t)}>Use</button>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--bg-2)' }}>
            <div className="card-head"><h3 style={{ fontSize: 13 }}>Preview</h3></div>
            {channel === 'email' && <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13.5 }}>{subject || <span className="dim">Subject…</span>}</div>}
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {body || <span className="dim">Your message preview appears here.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Outbox */}
      <div className="card pad-0 mt-24">
        <div className="card-head" style={{ padding: '18px 20px 0' }}>
          <h3>Outbox</h3><span className="hint">{outbox.length} messages</span>
        </div>
        {outbox.length === 0 ? (
          <Empty title="Outbox is empty" sub="Sent and drafted messages will show here." />
        ) : (
          <table className="table" style={{ marginTop: 8 }}>
            <thead><tr><th>Channel</th><th>To</th><th>Subject / preview</th><th>Status</th><th>When</th><th></th></tr></thead>
            <tbody>
              {outbox.map((o) => (
                <tr key={o.id}>
                  <td>{o.channel === 'email' ? <IconMail size={16} /> : <IconChat size={16} />}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{o.to}</td>
                  <td className="muted" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.subject || o.body}</td>
                  <td><Badge>{o.status}</Badge></td>
                  <td className="muted">{fromNow(o.sentAt || o.createdAt)}</td>
                  <td>
                    <div className="flex gap-8">
                      {o.status === 'draft' && <button className="btn ghost sm" onClick={() => updateItem('outbox', o.id, { status: 'sent', sentAt: new Date().toISOString() })}>Send</button>}
                      <button className="icon-btn" onClick={() => removeItem('outbox', o.id)} aria-label="Delete"><IconTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
