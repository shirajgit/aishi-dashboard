import { useMemo, useState } from 'react';
import { useDashboard, updateItem, removeItem } from '../store/db';
import { money, compactMoney, dateLong, fromNow } from '../lib/format';
import { Badge, Avatar, Empty, Stat } from '../components/UI';
import { IconWallet, IconRefresh, IconCard, IconTrash } from '../components/Icons';
import { Donut } from '../components/Charts';

const monthly = (s) => (s.interval === 'yearly' ? s.amount / 12 : s.amount);

export default function Subscriptions() {
  const state = useDashboard();
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    return state.subscriptions
      .map((s) => ({ ...s, customer: state.customers.find((c) => c.id === s.customerId) }))
      .filter((s) => filter === 'all' || s.status === filter)
      .sort((a, b) => monthly(b) - monthly(a));
  }, [state.subscriptions, state.customers, filter]);

  const activeSubs = state.subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const mrr = activeSubs.reduce((sum, s) => sum + monthly(s), 0);
  const renewingSoon = state.subscriptions.filter((s) => s.renewsAt && new Date(s.renewsAt) - Date.now() < 14 * 86400000 && new Date(s.renewsAt) > Date.now());

  const byInterval = [
    { label: 'Monthly', value: state.subscriptions.filter((s) => s.interval === 'monthly' && s.status !== 'canceled').length, color: '#38d9f5' },
    { label: 'Yearly', value: state.subscriptions.filter((s) => s.interval === 'yearly' && s.status !== 'canceled').length, color: '#7b8cde' },
  ];

  const cycle = (s) => {
    const next = s.status === 'active' ? 'paused' : s.status === 'paused' ? 'active' : 'active';
    updateItem('subscriptions', s.id, { status: next });
  };

  return (
    <>
      <div className="grid cols-4 mb-16">
        <Stat icon={<IconWallet size={19} />} label="MRR" value={compactMoney(mrr)} foot={`${activeSubs.length} active plans`} />
        <Stat icon={<IconCard size={19} />} label="ARR" value={compactMoney(mrr * 12)} foot="annualised" />
        <Stat icon={<IconRefresh size={19} />} label="Renewing ≤14 days" value={renewingSoon.length} foot="upcoming renewals" />
        <div className="card"><div className="card-head" style={{ marginBottom: 8 }}><h3 style={{ fontSize: 13 }}>Billing mix</h3></div><Donut segments={byInterval} size={104} thickness={16} centerLabel={activeSubs.length} centerSub="plans" /></div>
      </div>

      <div className="flex between mb-16">
        <div className="pill-tabs">
          {['all', 'active', 'trialing', 'paused', 'canceled'].map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="card pad-0">
        {rows.length === 0 ? (
          <Empty title="No subscriptions" />
        ) : (
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Plan</th><th>Interval</th><th className="right">Amount</th><th className="right">MRR</th><th>Status</th><th>Renews</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="person">
                      <Avatar name={s.customer?.name || '—'} />
                      <div><div className="name">{s.customer?.name || 'Unknown'}</div><div className="meta">{s.customer?.company}</div></div>
                    </div>
                  </td>
                  <td><span className="tag">{s.plan}</span></td>
                  <td className="muted" style={{ textTransform: 'capitalize' }}>{s.interval}</td>
                  <td className="right mono">{money(s.amount)}</td>
                  <td className="right mono">{money(Math.round(monthly(s)))}</td>
                  <td><Badge>{s.status}</Badge></td>
                  <td className="muted">{s.renewsAt ? fromNow(s.renewsAt) : '—'}</td>
                  <td>
                    <div className="flex gap-8">
                      {s.status !== 'canceled' && (
                        <button className="btn ghost sm" onClick={() => cycle(s)}>{s.status === 'paused' ? 'Resume' : 'Pause'}</button>
                      )}
                      {s.status !== 'canceled' ? (
                        <button className="btn ghost sm danger" onClick={() => updateItem('subscriptions', s.id, { status: 'canceled', renewsAt: null })}>Cancel</button>
                      ) : (
                        <button className="icon-btn" onClick={() => removeItem('subscriptions', s.id)} aria-label="Delete"><IconTrash size={16} /></button>
                      )}
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
