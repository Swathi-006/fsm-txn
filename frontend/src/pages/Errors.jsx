import { Link } from 'react-router-dom';
import { usePoll, money, when } from '../services/api.js';
import { Card, ResultBadge, Spinner } from '../components/Ui.jsx';

export default function Errors() {
  const { data } = usePoll('/dashboard/errors', 4000);
  if (!data) return <Spinner />;
  return (<>
    <h1>Errors and rollbacks</h1>
    <Card>{!data.length ? <p className="muted">No failures recorded. Run a failure scenario from <Link to="/create" className="link">New transaction</Link>.</p> :
      <div className="table-wrap"><table><thead><tr><th>Transaction</th><th>Amount</th><th>Failed service</th><th>Reason</th><th>Rollback</th><th>Final status</th><th>When</th></tr></thead>
        <tbody>{data.map((t) => <tr key={t.transactionId}><td><Link className="link" to={`/process/${t.transactionId}`}>{t.transactionId}</Link></td><td>{money(t.amount)}</td><td>{t.failureService}</td><td>{t.failureReason}</td><td>{t.currentState === 'Rolled Back' ? 'Completed' : 'Not required'}</td><td><ResultBadge status={t.finalStatus} /></td><td>{when(t.createdDate)}</td></tr>)}</tbody></table></div>}</Card>
  </>);
}
