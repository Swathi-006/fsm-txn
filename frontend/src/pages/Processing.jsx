import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Circle, Loader2, X } from 'lucide-react';
import { usePoll, money, when } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Card, ResultBadge, Spinner, StateBadge } from '../components/Ui.jsx';
import FsmDiagram from '../components/FsmDiagram.jsx';

const STEPS = [
  ['Authentication Service', 'AUTH_SUCCESS', 'Verify the user'], ['Payment Validation Service', 'PAYMENT_VALIDATED', 'Validate the payment'],
  ['Order Processing Service', 'ORDER_PROCESSED', 'Process the order'], ['Confirmation Service', 'TRANSACTION_CONFIRMED', 'Confirm the transaction'],
];

export default function Processing() {
  const { id: param } = useParams();
  const { data: latest } = usePoll(param ? null : '/transactions?limit=1', 4000);
  const id = param || latest?.[0]?.transactionId;
  const { data: tx } = usePoll(id ? `/transactions/${id}` : null, 700);
  const { data: logs } = usePoll(id ? `/transactions/${id}/logs` : null, 700);
  const toast = useToast(); const told = useRef('');
  useEffect(() => {
    if (!tx || !logs) return;
    const key = `${tx.transactionId}${tx.finalStatus}${logs.some((l) => l.event === 'INVALID_TRANSITION')}`;
    if (told.current === key) return;
    if (tx.finalStatus === 'Success') toast('Transaction completed', 'ok');
    else if (tx.finalStatus !== 'Pending') toast(`Transaction ${tx.finalStatus.toLowerCase()}: ${tx.failureReason}`, 'bad');
    else if (logs.some((l) => l.event === 'INVALID_TRANSITION')) toast('FSM rejected an invalid transition', 'bad');
    else { told.current = ''; return; }
    told.current = key;
  }, [tx, logs, toast]);

  if (!id) return <><h1>Processing</h1><p>No transactions yet. <Link to="/create" className="link">Create one</Link>.</p></>;
  if (!tx || !logs) return <Spinner label="Loading transaction" />;

  const halted = logs.some((l) => l.event === 'INVALID_TRANSITION');
  const done = tx.finalStatus !== 'Pending';
  let prevDone = true;
  const steps = STEPS.map(([name, okEvent, desc]) => {
    const failed = logs.some((l) => l.event === 'SERVICE_FAILED' && l.serviceName === name);
    const ok = logs.some((l) => l.event === okEvent);
    const status = failed ? 'failed' : ok ? 'done' : prevDone && !done && !halted ? 'running' : 'waiting';
    prevDone = ok;
    return { name, desc, status };
  });
  const rejected = logs.filter((l) => l.event === 'INVALID_TRANSITION');
  const icon = { done: <Check size={18} />, failed: <X size={18} />, running: <Loader2 size={18} className="spin" />, waiting: <Circle size={18} /> };

  return (<>
    <h1>Transaction {tx.transactionId}</h1>
    <div className="summary"><span>{tx.customerName}</span><span>{money(tx.amount)}</span><span>{tx.paymentMethod}</span><StateBadge state={tx.currentState} /><ResultBadge status={tx.finalStatus} /></div>
    {halted && <div className="alert bad"><strong>FSM rejected the transition.</strong> {rejected[rejected.length - 1].errorMessage} The transaction stays in {tx.currentState}.</div>}
    {tx.failureService && <div className="alert bad"><strong>{tx.failureService} failed.</strong> {tx.failureReason}{tx.currentState === 'Rolled Back' ? ' Rollback completed.' : ''}</div>}
    {tx.finalStatus === 'Success' && <div className="alert ok"><strong>Completed.</strong> All four services succeeded.</div>}
    <div className="grid2">
      <Card title="Service pipeline"><ol className="steps">{steps.map((s) => <li key={s.name} className={s.status}><span className="ico">{icon[s.status]}</span><div><b>{s.name}</b><small>{s.desc}</small></div></li>)}</ol></Card>
      <Card title="State machine"><FsmDiagram current={tx.currentState} logs={logs} /></Card>
    </div>
    <Card title="Event log"><div className="table-wrap"><table><thead><tr><th>Time</th><th>Service</th><th>Event</th><th>Transition</th><th>Error</th></tr></thead>
      <tbody>{logs.map((l) => <tr key={l._id}><td>{new Date(l.timestamp).toLocaleTimeString()}</td><td>{l.serviceName}</td><td>{l.event}</td><td>{l.previousState === l.currentState ? l.currentState : `${l.previousState} → ${l.currentState}`}</td><td className="err-cell">{l.errorMessage}</td></tr>)}</tbody></table></div></Card>
    <p><Link to="/create" className="btn primary inline">Run another scenario</Link></p>
  </>);
}
