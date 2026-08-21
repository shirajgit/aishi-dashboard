import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDashboard, useLoaded, useError } from '../store/db';
import { OPEN_STAGES } from '../lib/metrics';
import {
  IconGrid, IconLeads, IconUsers, IconCard, IconSend, IconNote, IconCheck, IconSettings, IconSearch,
} from './Icons';

const PAGES = {
  '/': { title: 'Overview', sub: 'Company performance at a glance' },
  '/leads': { title: 'Leads', sub: 'Your sales pipeline' },
  '/customers': { title: 'Customers', sub: 'Accounts and health' },
  '/subscriptions': { title: 'Subscriptions', sub: 'Recurring revenue' },
  '/outreach': { title: 'Cold Outreach', sub: 'Email & message sequences' },
  '/notes': { title: 'Notes', sub: 'Team knowledge base' },
  '/actions': { title: 'Next Actions', sub: 'What needs doing' },
  '/settings': { title: 'Settings', sub: 'Data & preferences' },
};

function Sidebar() {
  const state = useDashboard();
  const openLeads = state.leads.filter((l) => OPEN_STAGES.includes(l.status)).length;
  const dueActions = state.actions.filter((a) => !a.done).length;
  const drafts = state.outbox.filter((o) => o.status === 'draft').length;

  const items = [
    { to: '/', icon: <IconGrid />, label: 'Overview', end: true },
    { to: '/leads', icon: <IconLeads />, label: 'Leads', badge: openLeads },
    { to: '/customers', icon: <IconUsers />, label: 'Customers' },
    { to: '/subscriptions', icon: <IconCard />, label: 'Subscriptions' },
    { to: '/outreach', icon: <IconSend />, label: 'Outreach', badge: drafts || undefined },
    { to: '/notes', icon: <IconNote />, label: 'Notes' },
    { to: '/actions', icon: <IconCheck />, label: 'Next Actions', badge: dueActions },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#38d9f5" strokeWidth="2" /><circle cx="12" cy="12" r="2.5" fill="#38d9f5" /></svg>
        </div>
        <div>
          <div className="brand-name">Aishi</div>
          <div className="brand-sub">Operations</div>
        </div>
      </div>

      <div className="nav-label">Workspace</div>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          {it.icon}
          <span>{it.label}</span>
          {it.badge ? <span className="nav-badge">{it.badge}</span> : null}
        </NavLink>
      ))}

      <div className="nav-label">System</div>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <IconSettings />
        <span>Settings</span>
      </NavLink>

      <div style={{ marginTop: 'auto', padding: '14px 12px 4px', fontSize: 11, color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          All systems operational
        </div>
      </div>
    </aside>
  );
}

function Gate({ children }) {
  const loaded = useLoaded();
  const error = useError();

  if (error && !loaded) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Can’t reach the API</div>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          The dashboard couldn’t load data from the backend. Make sure the server is running:
          <div className="card mono" style={{ marginTop: 14, fontSize: 12.5, textAlign: 'left' }}>cd server && npm run dev</div>
        </div>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="empty" style={{ paddingTop: 100 }}>
        <div className="spinner" />
        <div style={{ marginTop: 14 }}>Loading workspace…</div>
      </div>
    );
  }
  return children;
}

export default function Layout() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || { title: 'Aishi', sub: '' };

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <h1>{page.title}</h1>
            <div className="sub">{page.sub}</div>
          </div>
          <div className="search">
            <IconSearch size={16} />
            <input placeholder="Search leads, customers…" />
          </div>
        </div>
        <div className="content">
          <Gate><Outlet /></Gate>
        </div>
      </div>
    </div>
  );
}
