import { useEffect, useState } from 'react';
import { api, money, when } from '../services/api.js';
import { Card, ResultBadge, Spinner, StateBadge } from '../components/Ui.jsx';

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState(null);
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => api(`/transactions?search=${encodeURIComponent(search)}&status=${status}`).then(setRows).catch(() => setRows([])), 250);
    return () => clearTimeout(t);
  }, [search, status]);
  const view = async (t) => { setSel(t); setLogs([]); setLogs(await api(`/transactions/${t.transactionId}/logs`)); };
  return (<>
    <h1>Transaction history</h1>
    <Card>
      <div className="filters"><input placeholder="Search by ID or customer" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by result"><option value="">All results</option>{['Pending', 'Success', 'Failed', 'Rolled Back'].map((s) => <option key={s}>{s}</option>)}</select></div>
      {!rows ? <Spinner /> : <div className="table-wrap"><table><thead><tr><th>Transaction ID</th><th>Customer</th><th>Amount</th><th>Date and time</th><th>State</th><th>Result</th><th>Action</th></tr></thead>
        <tbody>{rows.map((t) => <tr key={t.transactionId}><td>{t.transactionId}</td><td>{t.customerName}</td><td>{money(t.amount)}</td><td>{when(t.createdDate)}</td><td><StateBadge state={t.currentState} /></td><td><ResultBadge status={t.finalStatus} /></td><td><button className="btn small" onClick={() => view(t)}>View details</button></td></tr>)}
          {!rows.length && <tr><td colSpan="7" className="muted">No transactions match. Clear the filters or create a new transaction.</td></tr>}</tbody></table></div>}
    </Card>
    {sel && <div className="modal" onClick={() => setSel(null)}><div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Transaction details">
      <header><h3>{sel.transactionId}</h3><button className="btn small" onClick={() => setSel(null)}>Close</button></header>
      <dl className="details"><dt>Customer</dt><dd>{sel.customerName}</dd><dt>Amount</dt><dd>{money(sel.amount)}</dd><dt>Payment method</dt><dd>{sel.paymentMethod}</dd><dt>Order</dt><dd>{sel.description || '—'}</dd>
        <dt>State</dt><dd><StateBadge state={sel.currentState} /></dd><dt>Result</dt><dd><ResultBadge status={sel.finalStatus} /></dd>{sel.failureService && <><dt>Failed service</dt><dd>{sel.failureService}: {sel.failureReason}</dd></>}</dl>
      <h4>Execution history</h4>
      <div className="table-wrap"><table><thead><tr><th>Time</th><th>Service</th><th>Event</th><th>Transition</th><th>Error</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l._id}><td>{new Date(l.timestamp).toLocaleTimeString()}</td><td>{l.serviceName}</td><td>{l.event}</td><td>{l.previousState === l.currentState ? l.currentState : `${l.previousState} → ${l.currentState}`}</td><td className="err-cell">{l.errorMessage}</td></tr>)}</tbody></table></div>
    </div></div>}
  </>);
}
