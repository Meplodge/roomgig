import { useState } from 'react';
import { AlertCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isConfigured } from '../lib/supabase';

const Login = () => {
  const { signIn } = useAuth();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="sidebar-logo" style={{ width: 38, height: 38, fontSize: 18 }}>
            R
          </span>
          <div className="col">
            <strong style={{ fontSize: 17 }}>RoomGig Admin</strong>
            <span className="tiny muted">Platform management console</span>
          </div>
          <button
            type="button"
            className="icon-button"
            style={{ marginLeft: 'auto' }}
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {!isConfigured && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>
              Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and
              set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </span>
          </div>
        )}

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !isConfigured}>
          {busy && <span className="spinner" />}
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="tiny muted" style={{ textAlign: 'center' }}>
          Access is restricted to accounts on the administrator allowlist.
        </p>
      </form>
    </div>
  );
};

export default Login;
