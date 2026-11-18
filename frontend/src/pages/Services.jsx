import { usePoll, when } from '../services/api.js';
import { Spinner } from '../components/Ui.jsx';

export default function Services() {
  const { data, error } = usePoll('/services/status', 1500);
  if (error && !data) return <p className="error">{error}</p>;
  if (!data) return <Spinner />;
  return (<>
    <h1>Service monitoring</h1>
    <p className="muted">Status updates live as transactions run. A service shows Failed until its next successful run.</p>
    <div className="svc-grid">{data.map((s) => <section key={s.name} className={`card svc ${s.status.toLowerCase()}`}>
      <h3><span className={`dot ${s.status.toLowerCase()}`} />{s.name}</h3><strong>{s.status}</strong><p>{s.message}</p><small>Updated {when(s.updatedAt)} · {s.totalFailures} recorded failure{s.totalFailures === 1 ? '' : 's'}</small></section>)}</div>
  </>);
}
