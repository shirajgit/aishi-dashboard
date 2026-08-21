import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard, updateItem, resetData } from '../store/db';
import { kpis, leadsByStage, activityFeed, STAGE_COLORS } from '../lib/metrics';
import { compactMoney, money, num, fromNow, dateShort } from '../lib/format';
import { AreaChart, BarList, Donut } from '../components/Charts';
import { Stat, Badge, Avatar } from '../components/UI';
import {
  IconWallet, IconUsers, IconTarget, IconTrophy, IconMail, IconChat, IconCheck, IconClock, IconArrowOut, IconPlus, IconRefresh,
} from '../components/Icons';

const feedIcon = { email: <IconMail size={15} />, message: <IconChat size={15} />, win: <IconTrophy size={15} />, task: <IconCheck size={15} /> };

function SeedBanner() {
  const nav = useNavigate();
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      await resetData();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="card" style={{ background: 'linear-gradient(120deg, rgba(56,217,245,0.08), rgba(123,140,222,0.06))', borderColor: 'rgba(56,217,245,0.25)' }}>
      <div className="flex between gap-16" style={{ flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ marginBottom: 6 }}>Your workspace is empty</h3>
          <div className="muted" style={{ fontSize: 13 }}>Load a sample dataset to explore the dashboard, or start adding your own real leads and customers.</div>
        </div>
        <div className="flex gap-8">
          <button className="btn" onClick={() => nav('/leads')}><IconPlus size={16} /> Add a lead</button>
          <button className="btn primary" onClick={seed} disabled={seeding}>
            <IconRefresh size={16} /> {seeding ? 'Loading…' : 'Load demo data'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const state = useDashboard();
  const nav = useNavigate();
  const k = kpis(state);
  const isEmpty = state.leads.length === 0 && state.customers.length === 0 && state.subscriptions.length === 0;
  const stages = leadsByStage(state.leads);
  const feed = activityFeed(state);

  const rev = state.revenue;
  const hasRev = rev.length >= 2;
  const prevMrr = rev[rev.length - 2]?.mrr || 0;
  const mrrGrowth = hasRev && prevMrr ? Math.round(((k.mrr - prevMrr) / prevMrr) * 100) : null;

  const planSeg = ['Growth', 'Pro', 'Starter'].map((plan, i) => ({
    label: plan,
    value: state.customers.filter((c) => c.plan === plan && c.status !== 'churned').length,
    color: ['#38d9f5', '#7b8cde', '#f59e0b'][i],
  }));

  const upcoming = [...state.actions]
    .filter((a) => !a.done)
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);

  return (
    <>
      {isEmpty && <div className="mb-16"><SeedBanner /></div>}
      <div className="grid cols-4">
        <Stat icon={<IconWallet size={19} />} label="Monthly recurring revenue" value={compactMoney(k.mrr)} delta={mrrGrowth != null ? `${mrrGrowth}%` : null} deltaDir={mrrGrowth >= 0 ? 'up' : 'down'} foot="vs last month" />
        <Stat icon={<IconUsers size={19} />} label="Active customers" value={num(k.activeCustomers)} foot={`${k.churnRate}% churn rate`} />
        <Stat icon={<IconTarget size={19} />} label="Open pipeline" value={compactMoney(k.pipeline)} foot={`${k.openLeads} open leads`} />
        <Stat icon={<IconTrophy size={19} />} label="Win rate" value={`${k.winRate}%`} foot={`${k.dueToday} actions due today`} />
      </div>

      <div className="grid cols-3 mt-24" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Revenue trend</h3>
              <div className="hint">MRR over the last 6 months · ARR {money(k.arr)}</div>
            </div>
            {mrrGrowth != null && (
              <span className="badge" style={{ background: mrrGrowth >= 0 ? 'rgba(74,222,128,0.14)' : 'rgba(244,63,94,0.14)', color: mrrGrowth >= 0 ? 'var(--green)' : 'var(--red)' }}>{mrrGrowth >= 0 ? '▲' : '▼'} {Math.abs(mrrGrowth)}%</span>
            )}
          </div>
          <AreaChart data={rev} valueKey="mrr" />
        </div>

        <div className="card">
          <div className="card-head"><h3>Customers by plan</h3></div>
          <Donut segments={planSeg} centerLabel={k.activeCustomers} centerSub="active" />
        </div>
      </div>

      <div className="grid cols-2 mt-24" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Pipeline by stage</h3>
            <button className="btn ghost sm" onClick={() => nav('/leads')}>View leads <IconArrowOut size={14} /></button>
          </div>
          <BarList
            items={stages.map((s) => ({
              label: s.stage,
              value: s.count,
              display: `${s.count} · ${compactMoney(s.value)}`,
              color: STAGE_COLORS[s.stage],
            }))}
          />
        </div>

        <div className="card pad-0">
          <div className="card-head" style={{ padding: '20px 20px 0' }}>
            <h3>Recent activity</h3>
          </div>
          <div style={{ padding: '12px 20px 8px' }}>
            {feed.map((f) => (
              <div key={f.id} style={{ display: 'flex', gap: 12, padding: '9px 0', alignItems: 'flex-start' }}>
                <div className="stat-icon" style={{ width: 30, height: 30, margin: 0 }}>{feedIcon[f.kind]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{f.text}</div>
                  <div className="dim" style={{ fontSize: 11.5 }}>{fromNow(f.when)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-24">
        <div className="card-head">
          <h3>Upcoming next actions</h3>
          <button className="btn ghost sm" onClick={() => nav('/actions')}>All actions <IconArrowOut size={14} /></button>
        </div>
        {upcoming.map((a) => {
          const overdue = new Date(a.due) < new Date(new Date().toDateString());
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <button className="checkbox" onClick={() => updateItem('actions', a.id, { done: true })} aria-label="Complete" />
              <span style={{ flex: 1 }}>{a.title}</span>
              <Badge color={a.priority === 'high' ? '#f43f5e' : a.priority === 'medium' ? '#f59e0b' : '#94a3b8'}>{a.priority}</Badge>
              <span className={overdue ? '' : 'muted'} style={{ fontSize: 12.5, color: overdue ? 'var(--red)' : undefined, display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 78, justifyContent: 'flex-end' }}>
                <IconClock size={13} /> {overdue ? 'overdue' : dateShort(a.due)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
