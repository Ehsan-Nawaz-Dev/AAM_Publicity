import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SamplingList from './components/SamplingList';
import AddSampling from './components/AddSampling';
import Profile from './components/Profile';
import { LogOut } from 'lucide-react';

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 82, 82, 0.1)',
          borderTopColor: '#ff5252',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#9ca3af', fontSize: '14px', fontFamily: 'Outfit' }}>Loading session...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in -> Show Login view (rendered inside root but without app bars)
  if (!token || !user) {
    return (
      <div className="mobile-container">
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
      case 'add':
        return <AddSampling token={token} onNavigate={setActiveTab} showToast={showToast} />;
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
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'samplings',
      label: 'Samplings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'add',
      label: 'Add New',
      isFab: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <div className="mobile-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`alert-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Screen Header */}
      <header className="mobile-header">
        <h1>AAM POWER</h1>
        <div className="mobile-header-actions">
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
            Hi, {user.name.split(' ')[0]}
          </span>
          <button className="icon-btn" onClick={handleLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Screen Content View */}
      <main className="view-content">
        {renderView()}
      </main>

      {/* Mobile Tab Navigation */}
      <nav className="bottom-nav">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item fab-item ${activeTab === tab.id ? 'active' : ''}`}
                title={tab.label}
              >
                {tab.icon}
              </button>
            );
          }
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
