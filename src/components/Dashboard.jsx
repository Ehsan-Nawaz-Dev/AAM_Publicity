import React, { useState, useEffect } from 'react';
import { Package, Award, MapPin, ArrowRight, MessageSquare, Clock, ShieldCheck, Compass } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard({ token, onNavigate, showToast }) {
  const [stats, setStats] = useState({ areaVisited: 0, samplesDistributed: 0, reviewReceived: 0 });
  const [recent, setRecent] = useState({ areas: [], distributions: [], reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/sampling-stats', { headers }),
          fetch('/api/sampling-recent', { headers })
        ]);

        if (!statsRes.ok || !recentRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const statsData = await statsRes.json();
        const recentData = await recentRes.json();

        setStats(statsData);
        setRecent(recentData);
      } catch (err) {
        console.error(err);
        showToast('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>Updating dashboard...</p>
      </div>
    );
  }

  // Calculate Doughnut Chart Data (Reviews Breakdown)
  const notReviewed = Math.max(0, stats.samplesDistributed - stats.reviewReceived);
  const doughnutData = {
    labels: ['Reviewed', 'Pending Review'],
    datasets: [
      {
        data: [stats.reviewReceived, notReviewed],
        backgroundColor: ['#00d2ff', 'rgba(255, 255, 255, 0.04)'],
        borderColor: ['#0d0f17', '#0d0f17'],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          font: { family: 'Outfit', size: 12, weight: '500' },
          boxWidth: 12,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: '#121420',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    cutout: '75%',
  };

  // Calculate Bar Chart Data (Distributions by City)
  const cityCounts = {};
  recent.distributions.forEach(d => {
    const city = d.city || 'Other';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const barLabels = Object.keys(cityCounts);
  const barDataValues = Object.values(cityCounts);

  const barData = {
    labels: barLabels.length > 0 ? barLabels : ['No Data'],
    datasets: [
      {
        label: 'Mechanics registered',
        data: barDataValues.length > 0 ? barDataValues : [0],
        backgroundColor: 'rgba(0, 210, 255, 0.7)',
        hoverBackgroundColor: '#00d2ff',
        borderRadius: 8,
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#121420',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Inter', size: 11 },
          stepSize: 1
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Outfit', size: 11, weight: '500' }
        }
      }
    }
  };

  // Get current/last visit location (most recent element)
  const currentVisit = recent.distributions.length > 0 ? recent.distributions[0] : null;
  const recentVisits = recent.distributions.length > 1 ? recent.distributions.slice(1, 5) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.samplesDistributed}</div>
            <div className="stat-label">Total Mechanics</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon blue">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.reviewReceived}</div>
            <div className="stat-label">Reviewed Profiles</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.areaVisited}</div>
            <div className="stat-label">Active Cities</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Split Grid */}
      <div className="dashboard-sections">
        
        {/* Left Columns: Stats & Timelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Charts Row */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '20px' }}>
              <span>Operational Analytics</span>
            </h3>
            
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {/* Doughnut Chart */}
              <div style={{ flex: '1', minWidth: '220px', height: '220px', position: 'relative' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div style={{
                  position: 'absolute',
                  top: '46%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'Outfit', color: '#00d2ff' }}>
                    {stats.samplesDistributed > 0 ? Math.round((stats.reviewReceived / stats.samplesDistributed) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Reviewed
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div style={{ flex: '1.5', minWidth: '280px', height: '220px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginBottom: '14px', fontFamily: 'Outfit', fontWeight: '600' }}>
                  Mechanics Registry by City
                </p>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Recent Reviews/Comments */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '20px' }}>
              <span>Recent Field Reviews</span>
            </h3>

            <div className="recent-list">
              {recent.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: '#6b7280' }}>
                  No reviews received yet.
                </div>
              ) : (
                recent.reviews.slice(0, 3).map((item) => (
                  <div key={item._id} className="recent-item" style={{ cursor: 'default' }}>
                    <div className="recent-avatar" style={{ color: '#00d2ff', background: 'rgba(0, 210, 255, 0.1)' }}>
                      <MessageSquare size={18} />
                    </div>
                    <div className="recent-info">
                      <div className="recent-name" style={{ color: '#00d2ff', fontSize: '13px', fontWeight: '700' }}>
                        {item.name || item.shopName || 'Mechanic'}
                      </div>
                      <p style={{ fontSize: '13px', color: '#e5e7eb', marginTop: '4px', fontStyle: 'italic' }}>
                        "{item.comment}"
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Columns: Current Visits & Recent Visits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Current / Last Visiting Location */}
          <div className="current-visit-card">
            <div className="current-visit-header">
              <div className="pulse-indicator"></div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Visiting Location
              </h3>
            </div>
            
            {currentVisit ? (
              <div className="current-visit-body">
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'Outfit' }}>
                  {currentVisit.shopName || 'Unnamed Shop'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#00d2ff', fontWeight: '600' }}>
                  <MapPin size={14} />
                  <span>{currentVisit.city || 'Unknown City'}, {currentVisit.address || 'No Address'}</span>
                </div>
                
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> Visit Date
                  </div>
                  <div style={{ fontSize: '13px', color: 'white', marginTop: '2px', fontWeight: '600' }}>
                    {currentVisit.visitDate || currentVisit.date || 'No Date recorded'}
                  </div>
                </div>

                {currentVisit.location && (currentVisit.location.lat || currentVisit.location.lon) && (
                  <div style={{ background: 'rgba(0, 210, 255, 0.03)', border: '1px solid rgba(0, 210, 255, 0.1)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Compass size={10} /> GPS Coordinates
                      </div>
                      <div style={{ fontSize: '12px', color: 'white', marginTop: '2px', fontFamily: 'monospace' }}>
                        Lat: {currentVisit.location.lat?.toFixed(5) || 'N/A'}, Lon: {currentVisit.location.lon?.toFixed(5) || 'N/A'}
                      </div>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${currentVisit.location.lat},${currentVisit.location.lon}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px' }}
                    >
                      Open Map
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#6b7280' }}>
                No active visits logged.
              </div>
            )}
          </div>

          {/* Recent Visiting Locations Timeline */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '20px' }}>
              <span>Recent Visiting Locations</span>
              <span className="section-link" onClick={() => onNavigate('samplings')}>
                View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle' }} />
              </span>
            </div>

            <div className="recent-list">
              {recentVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: '#6b7280' }}>
                  No other locations logged.
                </div>
              ) : (
                recentVisits.map((item) => (
                  <div key={item._id} className="recent-item" onClick={() => onNavigate('samplings')}>
                    <div className="recent-avatar">
                      {item.shopName ? item.shopName[0].toUpperCase() : 'S'}
                    </div>
                    <div className="recent-info">
                      <div className="recent-name">{item.shopName || 'Unnamed Shop'}</div>
                      <div className="recent-meta">
                        <span>{item.city || item.address || 'Unknown'}</span>
                        <span>{item.visitDate || 'No Date'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;
