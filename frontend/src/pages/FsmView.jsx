import { useEffect, useState } from 'react';
import { api, usePoll } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Card, Spinner, StateBadge } from '../components/Ui.jsx';
import FsmDiagram from '../components/FsmDiagram.jsx';

const STATES = ['Initiated', 'Validating', 'Processing', 'Completed', 'Failed', 'Rolled Back'];
const RULES = ['Initiated → Validating', 'Validating → Processing', 'Processing → Completed', 'Validating → Failed', 'Processing → Failed', 'Failed → Rolled Back'];

export default function FsmView() {
  const { data: list } = usePoll('/transactions?limit=30', 5000);
  const [id, setId] = useState('');
  const [to, setTo] = useState('Validating');
  const [msg, setMsg] = useState(null);
  const toast = useToast();
  useEffect(() => { if (!id && list?.length) setId(list[0].transactionId); }, [list, id]);
  const { data: tx } = usePoll(id ? `/transactions/${id}` : null, 1000);
  const { data: logs } = usePoll(id ? `/transactions/${id}/logs` : null, 1000);

  const attempt = async () => {
    try { const r = await api(`/transactions/${id}/transition`, { method: 'POST', body: { to } }); setMsg({ ok: true, text: r.message }); toast(r.message, 'ok'); }
    catch (e) { setMsg({ ok: false, text: e.message }); toast('Transition rejected by the FSM', 'bad'); }
  };
  if (!list) return <Spinner />;
  return (<>
    <h1>State machine</h1>
    <div className="grid2">
      <Card title="Transition rules"><ul className="rules">{RULES.map((r) => <li key={r}>{r}</li>)}</ul><p className="muted">Any other transition is rejected and logged.</p></Card>
      <Card title="Try a transition">
        <div className="form one">
          <label>Transaction<select value={id} onChange={(e) => { setId(e.target.value); setMsg(null); }}>{list.map((t) => <option key={t.transactionId} value={t.transactionId}>{t.transactionId} · {t.currentState}</option>)}</select></label>
          <label>Move to<select value={to} onChange={(e) => setTo(e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <button className="btn primary" onClick={attempt} disabled={!id}>Attempt transition</button>
          {msg && <p className={msg.ok ? 'alert ok' : 'alert bad'} role="alert">{msg.text}</p>}
        </div>
      </Card>
    </div>
    <Card title={tx ? `Current state of ${tx.transactionId}` : 'Diagram'} right={tx && <StateBadge state={tx.currentState} />}>
      <FsmDiagram current={tx?.currentState} logs={logs || []} />
    </Card>
    <Card title="Transition history"><div className="table-wrap"><table><thead><tr><th>Time</th><th>From</th><th>To</th><th>Event</th><th>Service</th></tr></thead>
      <tbody>{(logs || []).filter((l) => l.previousState !== l.currentState).map((l) => <tr key={l._id}><td>{new Date(l.timestamp).toLocaleTimeString()}</td><td>{l.previousState}</td><td>{l.currentState}</td><td>{l.event}</td><td>{l.serviceName}</td></tr>)}</tbody></table></div></Card>
  </>);
}
