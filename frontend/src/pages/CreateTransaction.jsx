import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Card } from '../components/Ui.jsx';

const genId = () => `TXN-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const SCENARIOS = [
  ['success', 'Successful transaction: all services succeed'], ['auth_fail', 'Authentication failure'], ['payment_fail', 'Payment validation failure'],
  ['order_fail', 'Order processing failure (triggers rollback)'], ['invalid_transition', 'Invalid transition: FSM rejects an illegal jump'],
];

export default function CreateTransaction() {
  const [id] = useState(genId);
  const [f, setF] = useState({ customerName: '', amount: '', paymentMethod: 'Credit Card', description: '', scenario: 'success' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate(); const toast = useToast();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const start = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.customerName.trim()) return setErr('Enter the customer name');
    if (!(Number(f.amount) > 0)) return setErr('Enter an amount greater than 0');
    setBusy(true);
    try {
      const tx = await api('/transactions', { method: 'POST', body: { ...f, transactionId: id } });
      await api(`/transactions/${tx.transactionId}/execute`, { method: 'POST', body: { scenario: f.scenario } });
      toast(`Transaction ${tx.transactionId} started`, 'info');
      nav(`/process/${tx.transactionId}`);
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (<>
    <h1>New transaction</h1>
    <Card>
      <form className="form" onSubmit={start} noValidate>
        <label>Transaction ID<input value={id} readOnly /></label>
        <label>Customer name<input value={f.customerName} onChange={set('customerName')} /></label>
        <label>Amount (INR)<input type="number" min="0" step="0.01" value={f.amount} onChange={set('amount')} /></label>
        <label>Payment method<select value={f.paymentMethod} onChange={set('paymentMethod')}>{['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'].map((m) => <option key={m}>{m}</option>)}</select></label>
        <label className="wide">Order description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
        <fieldset className="wide"><legend>Test scenario</legend>
          {SCENARIOS.map(([v, l]) => <label key={v} className="radio"><input type="radio" name="sc" checked={f.scenario === v} onChange={() => setF({ ...f, scenario: v })} />{l}</label>)}
        </fieldset>
        {err && <p className="error wide" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Starting…' : 'Start transaction'}</button>
      </form>
    </Card>
  </>);
}
