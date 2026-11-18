import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (mode === 'register' && !f.name.trim()) return setErr('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
    if (f.password.length < 8) return setErr('Password must be at least 8 characters');
    setBusy(true);
    try {
      const d = await api(`/auth/${mode}`, { method: 'POST', body: f });
      localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user));
      window.location.href = '/';
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-art"><ShieldCheck size={44} /><h1>Verify every step of a transaction.</h1><p>Four simulated services, one finite state machine, and a log of every transition it accepted or rejected.</p></div>
      <form className="login-form" onSubmit={submit} noValidate>
        <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
        {mode === 'register' && <label>Name<input value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</button>
        {mode === 'login' && <small className="hint">Demo after seeding: demo@example.com / Demo@1234</small>}
      </form>
    </div>
  );
}
