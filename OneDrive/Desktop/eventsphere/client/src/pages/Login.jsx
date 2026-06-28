import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      const redirectTo = location.state?.from || '/events';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Log in</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Welcome back to EventSphere.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            className="input" id="email" name="email" type="email"
            value={form.email} onChange={onChange} required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input
            className="input" id="password" name="password" type="password"
            value={form.password} onChange={onChange} required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        No account? <Link to="/signup" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Sign up</Link>
      </p>
    </div>
  );
}
