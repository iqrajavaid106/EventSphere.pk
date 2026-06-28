import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'attendee', city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Create your account</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        Discover and host events near you.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="fullName">Full name</label>
          <input className="input" id="fullName" name="fullName" value={form.fullName} onChange={onChange} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" value={form.email} onChange={onChange} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" value={form.password} onChange={onChange} minLength={8} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" value={form.city} onChange={onChange} placeholder="e.g. Lahore" />
        </div>
        <div className="field">
          <label className="label" htmlFor="role">I want to</label>
          <select className="input" id="role" name="role" value={form.role} onChange={onChange}>
            <option value="attendee">Attend events</option>
            <option value="organizer">Host events</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
