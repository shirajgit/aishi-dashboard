import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma, models, sanitize } from './db.js';
import { buildSeed } from './seedData.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const keys = Object.keys(models);
const valid = (key) => Object.prototype.hasOwnProperty.call(models, key);

// Health check.
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Full snapshot the front-end loads on boot.
app.get('/api/state', async (_req, res, next) => {
  try {
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
    res.json({ leads, customers, subscriptions, templates, outbox, notes, actions, revenue, projects });
  } catch (e) {
    next(e);
  }
});

// Wipe everything and re-seed the demo dataset. (Declared before the generic
// /api/:key routes so "reset"/"clear" aren't captured as a collection name.)
app.post('/api/reset', async (_req, res, next) => {
  try {
    await seedDatabase();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Clear all business data for a real, empty workspace. Keeps outreach templates.
app.post('/api/clear', async (_req, res, next) => {
  try {
    await clearDatabase();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Create.
app.post('/api/:key', async (req, res, next) => {
  const { key } = req.params;
  if (!valid(key)) return res.status(404).json({ error: 'unknown collection' });
  try {
    const data = sanitize(key, req.body, { withId: true });
    const created = await models[key]().create({ data });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// Update.
app.patch('/api/:key/:id', async (req, res, next) => {
  const { key, id } = req.params;
  if (!valid(key)) return res.status(404).json({ error: 'unknown collection' });
  try {
    const data = sanitize(key, req.body, { withId: false });
    const updated = await models[key]().update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Delete.
app.delete('/api/:key/:id', async (req, res, next) => {
  const { key, id } = req.params;
  if (!valid(key)) return res.status(404).json({ error: 'unknown collection' });
  try {
    await models[key]().delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export async function clearDatabase() {
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

export async function seedDatabase() {
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

const PORT = process.env.PORT || 4000;

// Only start listening when run directly (not when imported by the seed script).
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  app.listen(PORT, () => console.log(`Aishi API on http://localhost:${PORT}`));
}

export { app, keys };
