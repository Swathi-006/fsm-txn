import { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, GitBranch, History, LayoutDashboard, LogOut, Menu, PlusCircle, Server, ShieldCheck } from 'lucide-react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateTransaction from './pages/CreateTransaction.jsx';
import Processing from './pages/Processing.jsx';
import FsmView from './pages/FsmView.jsx';
import HistoryPage from './pages/History.jsx';
import Services from './pages/Services.jsx';
import Errors from './pages/Errors.jsx';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/create', 'New transaction', PlusCircle], ['/process', 'Processing', Activity], ['/fsm', 'State machine', GitBranch],
  ['/history', 'History', History], ['/services', 'Services', Server], ['/errors', 'Errors & rollbacks', AlertTriangle],
];

function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.clear(); nav('/login'); };
  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <div className="brand"><ShieldCheck size={22} /><span>TxnVerify</span></div>
        <nav>{NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon size={18} />{label}</NavLink>)}</nav>
        <div className="side-foot"><div>{user.name}<small>{user.email}</small></div><button className="btn ghost" onClick={logout}><LogOut size={16} />Log out</button></div>
      </aside>
      <main className="main">
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu size={20} /></button>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const authed = !!localStorage.getItem('token');
  const guard = (el) => (authed ? <Shell>{el}</Shell> : <Navigate to="/login" replace />);
  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={guard(<Dashboard />)} />
      <Route path="/create" element={guard(<CreateTransaction />)} />
      <Route path="/process" element={guard(<Processing />)} />
      <Route path="/process/:id" element={guard(<Processing />)} />
      <Route path="/fsm" element={guard(<FsmView />)} />
      <Route path="/history" element={guard(<HistoryPage />)} />
      <Route path="/services" element={guard(<Services />)} />
      <Route path="/errors" element={guard(<Errors />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
