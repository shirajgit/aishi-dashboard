import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Maps the API collection keys to their Prisma models.
export const models = {
  leads: () => prisma.lead,
  customers: () => prisma.customer,
  subscriptions: () => prisma.subscription,
  templates: () => prisma.template,
  outbox: () => prisma.outbox,
  notes: () => prisma.note,
  actions: () => prisma.action,
  projects: () => prisma.project,
};

// Whitelisted writable fields per collection (id included for create).
export const FIELDS = {
  leads: ['id', 'name', 'company', 'email', 'phone', 'source', 'status', 'value', 'service', 'notes', 'createdAt', 'lastContact'],
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

/** Keep only allowed fields and coerce types so bad input can't crash Prisma. */
export function sanitize(key, body, { withId }) {
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
