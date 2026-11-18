import { useEffect, useState } from 'react';
const BASE = import.meta.env.VITE_API_URL || '/api';
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !path.startsWith('/auth')) { localStorage.clear(); window.location.href = '/login'; }
  if (!res.ok) { const e = new Error(data.message || 'Request failed'); e.data = data; throw e; }
  return data;
}
// Polls an endpoint so pages update in near real time.
export function usePoll(path, ms = 1500) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!path) { setData(null); return; }
    let live = true;
    const tick = () => api(path).then((d) => { if (live) { setData(d); setError(''); } }).catch((e) => live && setError(e.message));
    tick();
    const id = setInterval(tick, ms);
    return () => { live = false; clearInterval(id); };
  }, [path, ms]);
  return { data, error };
}
export const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
export const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
