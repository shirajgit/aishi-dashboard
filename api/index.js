// Vercel serverless API for the Aishi dashboard.
// A vercel.json rewrite funnels ALL /api/* requests (including nested paths like
// /api/leads/:id) to this single function, which routes them itself. The path is
// read from req.url so it works regardless of Vercel's dynamic routing.
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
  projects: () => prisma.project,
};

const FIELDS = {
  leads: ['id', 'name', 'company', 'email', 'phone', 'source', 'status', 'value', 'service', 'createdAt', 'lastContact'],
  customers: ['id', 'name', 'company', 'email', 'plan', 'mrr', 'status', 'since', 'health'],
  subscriptions: ['id', 'customerId', 'plan', 'amount', 'interval', 'status', 'startedAt', 'renewsAt'],
  templates: ['id', 'name', 'channel', 'subject', 'body'],
  outbox: ['id', 'channel', 'to', 'leadId', 'subject', 'body', 'status', 'createdAt', 'sentAt'],
  notes: ['id', 'title', 'body', 'tags', 'pinned', 'createdAt'],
  actions: ['id', 'title', 'due', 'priority', 'done', 'relatedType', 'relatedId'],
  projects: ['id', 'title', 'client', 'service', 'status', 'value', 'deadline', 'notes', 'createdAt'],
};

const INT_FIELDS = new Set(['value', 'mrr', 'amount', 'health']);
const DATE_FIELDS = new Set(['createdAt', 'lastContact', 'since', 'startedAt', 'renewsAt', 'sentAt', 'due', 'deadline']);

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
  const [leads, customers, subscriptions, templates, outbox, notes, actions, revenue, projects] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.customer.findMany({ orderBy: { since: 'desc' } }),
    prisma.subscription.findMany(),
    prisma.template.findMany(),
    prisma.outbox.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.note.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.action.findMany({ orderBy: { due: 'asc' } }),
    prisma.revenuePoint.findMany({ orderBy: { idx: 'asc' } }),
    prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);
  return { leads, customers, subscriptions, templates, outbox, notes, actions, revenue, projects };
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
    prisma.project.deleteMany(),
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
    prisma.project.deleteMany(),
    prisma.lead.createMany({ data: seed.leads }),
    prisma.customer.createMany({ data: seed.customers }),
    prisma.subscription.createMany({ data: seed.subscriptions }),
    prisma.template.createMany({ data: seed.templates }),
    prisma.outbox.createMany({ data: seed.outbox }),
    prisma.note.createMany({ data: seed.notes }),
    prisma.action.createMany({ data: seed.actions }),
    prisma.revenuePoint.createMany({ data: seed.revenue }),
    prisma.project.createMany({ data: seed.projects }),
  ]);
}

// Send a real email via the configured Gmail account (SMTP).
// Requires env: GMAIL_APP_PASSWORD (16-char Google App Password). GMAIL_USER
// defaults to the Aishi address.
async function sendEmail(body, res) {
  const { to, subject, body: text } = body;
  if (!to || !text) return res.status(400).json({ error: 'missing "to" or "body"' });

  const user = process.env.GMAIL_USER || 'hello.aishitech@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return res.status(500).json({ error: 'Email not configured — set GMAIL_APP_PASSWORD in Vercel env.' });

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({ from: `Aishi Tech <${user}>`, to, subject: subject || '(no subject)', text });
    return res.json({ ok: true });
  } catch (e) {
    console.error('sendEmail failed:', e);
    return res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Read path segments after "/api" straight from the URL.
  const pathname = new URL(req.url, 'http://localhost').pathname;
  let parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'api') parts = parts.slice(1);
  const [key, id] = parts;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  try {
    if (req.method === 'GET' && key === 'health') return res.json({ ok: true });
    if (req.method === 'GET' && key === 'state') return res.json(await readState());
    if (req.method === 'POST' && key === 'reset') { await seedDatabase(); return res.json({ ok: true }); }
    if (req.method === 'POST' && key === 'clear') { await clearDatabase(); return res.json({ ok: true }); }
    if (req.method === 'POST' && key === 'send') return sendEmail(body, res);

    if (!models[key]) return res.status(404).json({ error: 'unknown collection' });

    if (req.method === 'POST') {
      const created = await models[key]().create({ data: sanitize(key, body, { withId: true }) });
      return res.status(201).json(created);
    }
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'missing id' });
      const updated = await models[key]().update({ where: { id }, data: sanitize(key, body, { withId: false }) });
      return res.json(updated);
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'missing id' });
      await models[key]().delete({ where: { id } });
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
