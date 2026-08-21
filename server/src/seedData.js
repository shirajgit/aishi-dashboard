// Seed dataset for the database. Dates are generated relative to "now" so the
// dashboard always looks current. Mirrors the original front-end demo data.
const day = 24 * 60 * 60 * 1000;
const at = (offsetDays) => new Date(Date.now() + offsetDays * day);

export function buildSeed() {
  const leads = [
    { id: 'ld_1', name: 'Rahul Mehta', company: 'BrightKart', email: 'rahul@brightkart.in', phone: '+91 98200 11223', source: 'Website', status: 'qualified', value: 180000, service: 'E-commerce', createdAt: at(-3), lastContact: at(-1) },
    { id: 'ld_2', name: 'Sara Powell', company: 'NorthLoop', email: 'sara@northloop.io', phone: '+44 7700 900123', source: 'Referral', status: 'proposal', value: 420000, service: 'Web App', createdAt: at(-9), lastContact: at(-2) },
    { id: 'ld_3', name: 'Deepak Nair', company: 'ClinicOne', email: 'deepak@clinicone.health', phone: '+91 90040 55667', source: 'Cold email', status: 'contacted', value: 260000, service: 'Web App', createdAt: at(-5), lastContact: at(-4) },
    { id: 'ld_4', name: 'Mei Chen', company: 'Loomly', email: 'mei@loomly.co', phone: '+65 8123 4567', source: 'LinkedIn', status: 'new', value: 150000, service: 'Mobile App', createdAt: at(-1), lastContact: null },
    { id: 'ld_5', name: 'Tom Becker', company: 'Rivet HR', email: 'tom@rivethr.com', phone: '+1 415 555 0182', source: 'Website', status: 'won', value: 540000, service: 'Web App', createdAt: at(-22), lastContact: at(-6) },
    { id: 'ld_6', name: 'Fatima Ali', company: 'Souk Mart', email: 'fatima@soukmart.ae', phone: '+971 50 123 4567', source: 'Referral', status: 'lost', value: 95000, service: 'E-commerce', createdAt: at(-18), lastContact: at(-11) },
    { id: 'ld_7', name: 'Jordan Blake', company: 'FleetIQ', email: 'jordan@fleetiq.app', phone: '+1 312 555 0147', source: 'Cold email', status: 'new', value: 320000, service: 'Mobile App', createdAt: at(0), lastContact: null },
    { id: 'ld_8', name: 'Priya Sharma', company: 'EduNest', email: 'priya@edunest.in', phone: '+91 99880 22110', source: 'LinkedIn', status: 'qualified', value: 210000, service: 'Website', createdAt: at(-7), lastContact: at(-3) },
  ];

  const customers = [
    { id: 'cu_1', name: 'Tom Becker', company: 'Rivet HR', email: 'tom@rivethr.com', plan: 'Growth', mrr: 45000, status: 'active', since: at(-140), health: 88 },
    { id: 'cu_2', name: 'Lena Fischer', company: 'Palette Studio', email: 'lena@palette.studio', plan: 'Pro', mrr: 22000, status: 'active', since: at(-95), health: 72 },
    { id: 'cu_3', name: 'Arjun Rao', company: 'Cotiva', email: 'arjun@cotiva.com', plan: 'Growth', mrr: 45000, status: 'active', since: at(-210), health: 91 },
    { id: 'cu_4', name: 'Grace Owusu', company: 'Handa Foods', email: 'grace@handafoods.com', plan: 'Starter', mrr: 9000, status: 'trial', since: at(-12), health: 60 },
    { id: 'cu_5', name: 'Victor Reyes', company: 'Nimbus Labs', email: 'victor@nimbuslabs.io', plan: 'Pro', mrr: 22000, status: 'active', since: at(-320), health: 79 },
    { id: 'cu_6', name: 'Hana Kim', company: 'Studio Ori', email: 'hana@studioori.kr', plan: 'Starter', mrr: 9000, status: 'churned', since: at(-260), health: 24 },
  ];

  const subscriptions = [
    { id: 'sb_1', customerId: 'cu_1', plan: 'Growth', amount: 45000, interval: 'monthly', status: 'active', startedAt: at(-140), renewsAt: at(6) },
    { id: 'sb_2', customerId: 'cu_2', plan: 'Pro', amount: 22000, interval: 'monthly', status: 'active', startedAt: at(-95), renewsAt: at(12) },
    { id: 'sb_3', customerId: 'cu_3', plan: 'Growth', amount: 540000, interval: 'yearly', status: 'active', startedAt: at(-210), renewsAt: at(155) },
    { id: 'sb_4', customerId: 'cu_4', plan: 'Starter', amount: 9000, interval: 'monthly', status: 'trialing', startedAt: at(-12), renewsAt: at(2) },
    { id: 'sb_5', customerId: 'cu_5', plan: 'Pro', amount: 22000, interval: 'monthly', status: 'active', startedAt: at(-320), renewsAt: at(9) },
    { id: 'sb_6', customerId: 'cu_6', plan: 'Starter', amount: 9000, interval: 'monthly', status: 'canceled', startedAt: at(-260), renewsAt: null },
  ];

  const templates = [
    { id: 'tpl_1', name: 'Cold intro — SaaS', channel: 'email', subject: 'Quick idea for {{company}}', body: 'Hi {{name}},\n\nI run delivery at Aishi Technologies — we build web apps, AI automations and internal tools. I had a specific idea for {{company}} that could cut manual work on your side.\n\nWorth a 15-min call this week?\n\n— Shiraj, Aishi Technologies' },
    { id: 'tpl_2', name: 'Follow-up #1', channel: 'email', subject: 'Re: {{company}} — following up', body: 'Hi {{name}},\n\nCircling back on my note. Happy to send a short Loom showing what we’d build for {{company}} if that’s easier than a call.\n\nWhich works better?\n\n— Shiraj' },
    { id: 'tpl_3', name: 'WhatsApp intro', channel: 'whatsapp', subject: '', body: 'Hi {{name}}, this is Shiraj from Aishi Technologies. We build custom web/mobile apps & AI tools. Saw {{company}} and thought there could be a strong fit — open to a quick chat?' },
    { id: 'tpl_4', name: 'Proposal nudge', channel: 'email', subject: 'Your proposal is ready, {{name}}', body: 'Hi {{name}},\n\nThe proposal for {{company}} is ready. It covers scope, timeline and a fixed price. Want me to walk you through it on a call?\n\n— Shiraj, Aishi Technologies' },
  ];

  const outbox = [
    { id: 'ob_1', channel: 'email', to: 'deepak@clinicone.health', leadId: 'ld_3', subject: 'Quick idea for ClinicOne', body: 'Hi Deepak, ...', status: 'sent', createdAt: at(-4), sentAt: at(-4) },
    { id: 'ob_2', channel: 'email', to: 'jordan@fleetiq.app', leadId: 'ld_7', subject: 'Quick idea for FleetIQ', body: 'Hi Jordan, ...', status: 'draft', createdAt: at(0), sentAt: null },
    { id: 'ob_3', channel: 'whatsapp', to: '+65 8123 4567', leadId: 'ld_4', subject: '', body: 'Hi Mei, this is Shiraj from Aishi ...', status: 'sent', createdAt: at(-1), sentAt: at(-1) },
    { id: 'ob_4', channel: 'email', to: 'sara@northloop.io', leadId: 'ld_2', subject: 'Your proposal is ready, Sara', body: 'Hi Sara, ...', status: 'replied', createdAt: at(-2), sentAt: at(-2) },
  ];

  const notes = [
    { id: 'nt_1', title: 'NorthLoop scope', body: 'Sara wants a customer portal + billing. Budget ~4L. Decision by end of month. Push proposal call.', tags: ['deal', 'hot'], pinned: true, createdAt: at(-2) },
    { id: 'nt_2', title: 'ClinicOne — tech notes', body: 'They use legacy PHP. Migration risk. Suggest phased rollout. Deepak is the champion, CTO is skeptical.', tags: ['tech'], pinned: false, createdAt: at(-4) },
    { id: 'nt_3', title: 'Q3 focus', body: 'Double down on cold email for healthcare + logistics. Best reply rates so far.', tags: ['strategy'], pinned: true, createdAt: at(-8) },
  ];

  const actions = [
    { id: 'ac_1', title: 'Send NorthLoop proposal deck', due: at(1), priority: 'high', done: false, relatedType: 'lead', relatedId: 'ld_2' },
    { id: 'ac_2', title: 'Follow up with ClinicOne (Deepak)', due: at(0), priority: 'high', done: false, relatedType: 'lead', relatedId: 'ld_3' },
    { id: 'ac_3', title: 'Onboarding call — Handa Foods trial', due: at(2), priority: 'medium', done: false, relatedType: 'customer', relatedId: 'cu_4' },
    { id: 'ac_4', title: 'Check Studio Ori churn reason', due: at(-1), priority: 'medium', done: false, relatedType: 'customer', relatedId: 'cu_6' },
    { id: 'ac_5', title: 'Prep FleetIQ cold sequence', due: at(3), priority: 'low', done: false, relatedType: 'lead', relatedId: 'ld_7' },
    { id: 'ac_6', title: 'Send invoice — Cotiva renewal', due: at(-2), priority: 'high', done: true, relatedType: 'customer', relatedId: 'cu_3' },
  ];

  const now = new Date();
  const base = [82, 95, 110, 128, 141, 168];
  const nl = [12, 15, 11, 18, 21, 24];
  const wn = [2, 3, 2, 4, 3, 5];
  const revenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenue.push({
      id: `rv_${5 - i}`,
      idx: 5 - i,
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      mrr: base[5 - i] * 1000,
      newLeads: nl[5 - i],
      won: wn[5 - i],
    });
  }

  const projects = [
    { id: 'pj_1', title: 'BrightKart storefront revamp', client: 'BrightKart', service: 'E-commerce', status: 'pending', value: 180000, deadline: at(20), notes: 'Custom storefront + admin dashboard.', createdAt: at(-6) },
    { id: 'pj_2', title: 'Rivet HR employee portal', client: 'Rivet HR', service: 'Web App', status: 'completed', value: 540000, deadline: at(-4), notes: 'Delivered and live.', createdAt: at(-30) },
    { id: 'pj_3', title: 'ClinicOne booking app', client: 'ClinicOne', service: 'Mobile App', status: 'not-started', value: 260000, deadline: at(45), notes: 'Kickoff pending signed contract.', createdAt: at(-2) },
    { id: 'pj_4', title: 'EduNest marketing site', client: 'EduNest', service: 'Website', status: 'pending', value: 210000, deadline: at(14), notes: 'Design approved, in build.', createdAt: at(-5) },
  ];

  return { leads, customers, subscriptions, templates, outbox, notes, actions, revenue, projects };
}
