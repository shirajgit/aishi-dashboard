import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Subscriptions from './pages/Subscriptions';
import Projects from './pages/Projects';
import Outreach from './pages/Outreach';
import Notes from './pages/Notes';
import Actions from './pages/Actions';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="leads" element={<Leads />} />
        <Route path="customers" element={<Customers />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="projects" element={<Projects />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="notes" element={<Notes />} />
        <Route path="actions" element={<Actions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
