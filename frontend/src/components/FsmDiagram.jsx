// SVG state diagram. `current` is highlighted; edges taken in `logs` are drawn in the accent colour.
const NODES = { Initiated: [80, 90], Validating: [260, 90], Processing: [440, 90], Completed: [620, 90], Failed: [350, 230], 'Rolled Back': [550, 230] };
const EDGES = [
  ['Initiated', 'Validating', [135, 90, 205, 90]], ['Validating', 'Processing', [315, 90, 385, 90]], ['Processing', 'Completed', [495, 90, 565, 90]],
  ['Validating', 'Failed', [270, 112, 325, 208]], ['Processing', 'Failed', [430, 112, 375, 208]], ['Failed', 'Rolled Back', [405, 230, 495, 230]],
];
export default function FsmDiagram({ current, logs = [] }) {
  const taken = new Set(logs.filter((l) => l.previousState !== l.currentState).map((l) => `${l.previousState}>${l.currentState}`));
  const visited = new Set(['Initiated', ...logs.map((l) => l.currentState)]);
  return (
    <svg viewBox="0 0 700 290" className="fsm" role="img" aria-label={`State diagram, current state ${current || 'none'}`}>
      <defs>{['a', 'b'].map((k) => <marker key={k} id={`ar-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill={k === 'a' ? '#1d4ed8' : '#9fb0c8'} /></marker>)}</defs>
      {EDGES.map(([a, b, [x1, y1, x2, y2]]) => { const on = taken.has(`${a}>${b}`); return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? '#1d4ed8' : '#c3cfe0'} strokeWidth={on ? 3 : 2} markerEnd={`url(#ar-${on ? 'a' : 'b'})`} />; })}
      {Object.entries(NODES).map(([name, [x, y]]) => {
        const active = name === current;
        const bad = name === 'Failed' || name === 'Rolled Back';
        return <g key={name} className={active ? 'node active' : 'node'}>
          <rect x={x - 55} y={y - 22} width="110" height="44" rx="8" fill={active ? (bad ? '#b42318' : '#1d4ed8') : visited.has(name) ? '#e6eefc' : '#fff'} stroke={active ? '#0a2342' : visited.has(name) ? '#1d4ed8' : '#9fb0c8'} strokeWidth={active ? 3 : 1.5} />
          <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill={active ? '#fff' : '#0a2342'}>{name}</text>
        </g>;
      })}
    </svg>
  );
}
