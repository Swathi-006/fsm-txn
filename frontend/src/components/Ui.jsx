export const slug = (s) => (s || '').toLowerCase().replace(/\s+/g, '-');
export const StateBadge = ({ state }) => <span className={`badge st-${slug(state)}`}>{state}</span>;
export const ResultBadge = ({ status }) => <span className={`badge rs-${slug(status)}`}>{status}</span>;
export const Spinner = ({ label = 'Loading' }) => <div className="spinner-wrap"><span className="spinner" />{label}</div>;
export const Card = ({ title, children, right }) => <section className="card">{title && <header className="card-h"><h3>{title}</h3>{right}</header>}{children}</section>;
export const Stat = ({ label, value, tone }) => <div className={`stat ${tone || ''}`}><span>{label}</span><strong>{value}</strong></div>;
