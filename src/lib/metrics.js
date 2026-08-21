// Derived KPIs and rollups computed from raw collections.

export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
export const OPEN_STAGES = ['new', 'contacted', 'qualified', 'proposal'];

export function kpis(state) {
  const { leads, customers, subscriptions, actions } = state;

  const activeCustomers = customers.filter((c) => c.status === 'active');
  const mrr = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + (s.interval === 'yearly' ? s.amount / 12 : s.amount), 0);

  const openLeads = leads.filter((l) => OPEN_STAGES.includes(l.status));
  const pipeline = openLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  const decided = leads.filter((l) => l.status === 'won' || l.status === 'lost');
  const won = leads.filter((l) => l.status === 'won');
  const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : 0;

  const dueToday = actions.filter((a) => !a.done && new Date(a.due) <= endOfToday()).length;

  const churned = customers.filter((c) => c.status === 'churned').length;
  const churnRate = customers.length ? Math.round((churned / customers.length) * 100) : 0;

  return {
    mrr,
    arr: mrr * 12,
    activeCustomers: activeCustomers.length,
    openLeads: openLeads.length,
    pipeline,
    winRate,
    dueToday,
    churnRate,
  };
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function leadsByStage(leads) {
  return LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.status === stage).length,
    value: leads.filter((l) => l.status === stage).reduce((s, l) => s + (l.value || 0), 0),
  }));
}

export function activityFeed(state, limit = 8) {
  const items = [];
  state.outbox.forEach((o) =>
    items.push({
      id: o.id,
      when: o.sentAt || o.createdAt,
      kind: o.channel === 'email' ? 'email' : 'message',
      text:
        o.status === 'replied'
          ? `Reply received from ${o.to}`
          : o.status === 'sent'
          ? `${o.channel === 'email' ? 'Email' : 'Message'} sent to ${o.to}`
          : `Draft ${o.channel} for ${o.to}`,
    }),
  );
  state.leads
    .filter((l) => l.status === 'won')
    .forEach((l) => items.push({ id: `won_${l.id}`, when: l.lastContact || l.createdAt, kind: 'win', text: `Won ${l.company} (${l.name})` }));
  state.actions
    .filter((a) => a.done)
    .forEach((a) => items.push({ id: `done_${a.id}`, when: a.due, kind: 'task', text: `Completed: ${a.title}` }));

  return items
    .filter((i) => i.when)
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, limit);
}

export const STAGE_COLORS = {
  new: '#7b8cde',
  contacted: '#38d9f5',
  qualified: '#22d3ee',
  proposal: '#f59e0b',
  won: '#4ade80',
  lost: '#f43f5e',
};

export const STATUS_COLORS = {
  active: '#4ade80',
  trial: '#f59e0b',
  trialing: '#f59e0b',
  churned: '#f43f5e',
  canceled: '#f43f5e',
  paused: '#94a3b8',
  sent: '#38d9f5',
  draft: '#94a3b8',
  replied: '#4ade80',
  bounced: '#f43f5e',
};
