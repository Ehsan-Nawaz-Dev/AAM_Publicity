import React, { useState } from 'react';
import { User, Lock, KeyRound } from 'lucide-react';

function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password');
      showToast('All fields are required', 'error');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Login failed. Verify connection.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-brand">
        <div className="login-logo">A</div>
        <h2>AAM POWER</h2>
        <p>Field Mechanics Management Portal</p>
      </div>

      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#f87171',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {errorMsg}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Username</label>
          <div className="input-wrapper">
            <User className="input-icon" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
              placeholder="Enter username"
              disabled={submitting}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '24px' }}>
          <label className="input-label">Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ width: '100%' }}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite'
              }}></div>
              Connecting...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={18} />
              Login to Account
            </span>
          )}
        </button>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
          Authorized access only. Use pre-configured backend credentials (e.g. admin / 123).
        </div>
      </form>
    </div>
  );
}

export default Login;
