import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SamplingList from './components/SamplingList';
import Profile from './components/Profile';

function App() {
  const [token, setToken] = useState(localStorage.getItem('aam_token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Toast notifications state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Check auth validity on mount or token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('aam_token');
        setToken('');
        setUser(null);
        setLoading(false);
        showToast('Session expired. Please log in again.', 'error');
      });
  }, [token]);

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('aam_token', newToken);
    setToken(newToken);
    setUser(userData);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('aam_token');
    setToken('');
    setUser(null);
    setActiveTab('dashboard');
    showToast('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="muted">Restoring session…</p>
      </div>
    );
  }

  // Not logged in -> Show Login view
  if (!token || !user) {
    return (
      <div className="login-page-container">
        <div className="login-bg-mesh"></div>
        <div className="login-glow-orb orb-1"></div>
        <div className="login-glow-orb orb-2"></div>
        {toast && (
          <div className={`alert-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
        <Login onLogin={handleLogin} showToast={showToast} />
      </div>
    );
  }

  // Render navigation tab views
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard token={token} onNavigate={setActiveTab} showToast={showToast} />;
      case 'samplings':
        return <SamplingList token={token} showToast={showToast} />;
      case 'profile':
        return <Profile token={token} onLogout={handleLogout} onUserUpdate={(updatedName) => setUser(prev => ({ ...prev, name: updatedName }))} showToast={showToast} />;
      default:
        return <Dashboard token={token} onNavigate={setActiveTab} showToast={showToast} />;
    }
  };

  // Nav icons and items
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      caption: 'Field operations at a glance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'samplings',
      label: 'Mechanics',
      caption: 'Complete registry of every recorded mechanic',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Admin Profile',
      caption: 'Your account and security settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  return (
    <div className="web-layout">
      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          <div>
            <span className="sidebar-title">AAM POWER</span>
            <span className="sidebar-subtitle">Field Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              title={tab.label}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link danger" onClick={handleLogout} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Header */}
        <header className="top-header">
          <div className="page-title-area">
            <h1>{activeTabMeta?.label || 'AAM POWER'}</h1>
            <p>{activeTabMeta?.caption}</p>
          </div>
          <div className="top-header-actions">
            <div className="user-profile-badge">
              {user.profileImage ? (
                <img 
                  src={user.profileImage.startsWith('http') || user.profileImage.startsWith('/uploads') || user.profileImage.startsWith('/tmp') ? user.profileImage : '/api' + user.profileImage.replace('file://', '')} 
                  alt="avatar" 
                  className="user-avatar-mini" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                />
              ) : (
                <div className="user-avatar-mini" style={{ background: 'var(--grad-primary)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 700, color: '#04121a' }}>
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </div>
              )}
              <span className="user-name-mini">{user.name || 'Admin'}</span>
            </div>
            <button className="logout-btn-header" onClick={handleLogout} title="Sign Out">
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* View Content Wrapper */}
        <main className="content-wrapper">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
