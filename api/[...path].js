// Vercel serverless API for the Aishi dashboard.
// Serves the whole /api/* surface from one catch-all function so the live site
// (https://aishi-dashboard.vercel.app) talks to it on the same origin.
//
// Set DATABASE_URL in the Vercel project's Environment Variables (use the Neon
// *pooled* connection string with `&pgbouncer=true&schema=aishi_dashboard`).
import { PrismaClient } from '@prisma/client';
import { buildSeed } from '../server/src/seedData.js';

// Reuse one client across warm invocations instead of opening a new pool each time.
const prisma = globalThis._prisma ?? new PrismaClient();
if (!globalThis._prisma) globalThis._prisma = prisma;

const models = {
  leads: () => prisma.lead,
  customers: () => prisma.customer,
  subscriptions: () => prisma.subscription,
  templates: () => prisma.template,
  outbox: () => prisma.outbox,
  notes: () => prisma.note,
  actions: () => prisma.action,
};

const FIELDS = {
  leads: ['id', 'name', 'company', 'email', 'phone', 'source', 'status', 'value', 'owner', 'createdAt', 'lastContact'],
  customers: ['id', 'name', 'company', 'email', 'plan', 'mrr', 'status', 'since', 'health'],
  subscriptions: ['id', 'customerId', 'plan', 'amount', 'interval', 'status', 'startedAt', 'renewsAt'],
  templates: ['id', 'name', 'channel', 'subject', 'body'],
  outbox: ['id', 'channel', 'to', 'leadId', 'subject', 'body', 'status', 'createdAt', 'sentAt'],
  notes: ['id', 'title', 'body', 'tags', 'pinned', 'createdAt'],
  actions: ['id', 'title', 'due', 'priority', 'done', 'relatedType', 'relatedId'],
};

const INT_FIELDS = new Set(['value', 'mrr', 'amount', 'health']);
const DATE_FIELDS = new Set(['createdAt', 'lastContact', 'since', 'startedAt', 'renewsAt', 'sentAt', 'due']);

function sanitize(key, body, { withId }) {
  const allowed = FIELDS[key].filter((f) => (withId ? true : f !== 'id'));
  const out = {};
  for (const f of allowed) {
    if (!(f in body)) continue;
    let v = body[f];
    if (v !== null) {
      if (INT_FIELDS.has(f)) v = Math.round(Number(v)) || 0;
      else if (DATE_FIELDS.has(f)) v = new Date(v);
    }
    out[f] = v;
  }
  return out;
}

async function readState() {
  const [leads, customers, subscriptions, templates, outbox, notes, actions, revenue] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.customer.findMany({ orderBy: { since: 'desc' } }),
    prisma.subscription.findMany(),
    prisma.template.findMany(),
    prisma.outbox.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.note.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.action.findMany({ orderBy: { due: 'asc' } }),
    prisma.revenuePoint.findMany({ orderBy: { idx: 'asc' } }),
  ]);
  return { leads, customers, subscriptions, templates, outbox, notes, actions, revenue };
}

async function clearDatabase() {
  await prisma.$transaction([
    prisma.lead.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.outbox.deleteMany(),
    prisma.note.deleteMany(),
    prisma.action.deleteMany(),
    prisma.revenuePoint.deleteMany(),
  ]);
}

async function seedDatabase() {
  const seed = buildSeed();
  await prisma.$transaction([
    prisma.lead.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.template.deleteMany(),
    prisma.outbox.deleteMany(),
    prisma.note.deleteMany(),
    prisma.action.deleteMany(),
    prisma.revenuePoint.deleteMany(),
    prisma.lead.createMany({ data: seed.leads }),
    prisma.customer.createMany({ data: seed.customers }),
    prisma.subscription.createMany({ data: seed.subscriptions }),
    prisma.template.createMany({ data: seed.templates }),
    prisma.outbox.createMany({ data: seed.outbox }),
    prisma.note.createMany({ data: seed.notes }),
    prisma.action.createMany({ data: seed.actions }),
    prisma.revenuePoint.createMany({ data: seed.revenue }),
  ]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Resolve the path segments after "/api". Prefer Vercel's catch-all param,
  // but fall back to parsing req.url so this works no matter how it's routed.
  let parts = req.query && req.query.path ? [].concat(req.query.path) : [];
  if (parts.length === 0) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'api') parts = parts.slice(1);
  }
  const [key, id] = parts;
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  try {
    if (req.method === 'GET' && key === 'health') return res.json({ ok: true });
    if (req.method === 'GET' && key === 'state') return res.json(await readState());
    if (req.method === 'POST' && key === 'reset') { await seedDatabase(); return res.json({ ok: true }); }
    if (req.method === 'POST' && key === 'clear') { await clearDatabase(); return res.json({ ok: true }); }

    if (!models[key]) return res.status(404).json({ error: 'unknown collection' });

    if (req.method === 'POST') {
      const created = await models[key]().create({ data: sanitize(key, body, { withId: true }) });
      return res.status(201).json(created);
    }
    if (req.method === 'PATCH') {
      const updated = await models[key]().update({ where: { id }, data: sanitize(key, body, { withId: false }) });
      return res.json(updated);
    }
    if (req.method === 'DELETE') {
      await models[key]().delete({ where: { id } });
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
