import React, { useState, useEffect } from 'react';
import { Package, Award, MapPin, Eye, ArrowRight, MessageSquare } from 'lucide-react';
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2.5px solid rgba(255, 82, 82, 0.1)',
          borderTopColor: '#ff5252',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Updating dashboard...</p>
      </div>
    );
  }

  // 1. Doughnut Chart Data (Reviews Breakdown)
  const notReviewed = Math.max(0, stats.samplesDistributed - stats.reviewReceived);
  const doughnutData = {
    labels: ['Reviewed', 'Pending Review'],
    datasets: [
      {
        data: [stats.reviewReceived, notReviewed],
        backgroundColor: ['#10b981', 'rgba(255, 255, 255, 0.08)'],
        borderColor: ['#12131c', '#12131c'],
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
          font: { family: 'Outfit', size: 11, weight: '500' },
          boxWidth: 12,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: '#161826',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    cutout: '70%',
  };

  // 2. Bar Chart Data (Distributions by City based on recent distributions list)
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
        label: 'Distributions',
        data: barDataValues.length > 0 ? barDataValues : [0],
        backgroundColor: 'rgba(255, 82, 82, 0.85)',
        hoverBackgroundColor: '#ff5252',
        borderRadius: 6,
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
        backgroundColor: '#161826',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Inter', size: 10 },
          stepSize: 1
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Outfit', size: 10, weight: '500' }
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Page Title & Last Activity */}
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: '800', marginBottom: '2px' }}>
          Overview
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Real-time operations stats & field activity
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red">
            <Package size={16} />
          </div>
          <div className="stat-value">{stats.samplesDistributed}</div>
          <div className="stat-label">Distributed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Award size={16} />
          </div>
          <div className="stat-value">{stats.reviewReceived}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <MapPin size={16} />
          </div>
          <div className="stat-value">{stats.areaVisited}</div>
          <div className="stat-label">Cities</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 className="section-title">
          <span>Operational Health</span>
        </h3>
        
        <div style={{ display: 'flex', gap: '16px', height: '140px', alignItems: 'center', marginBottom: '8px' }}>
          {/* Doughnut Chart */}
          <div style={{ flex: '1', height: '100%', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit', color: '#10b981' }}>
                {stats.samplesDistributed > 0 ? Math.round((stats.reviewReceived / stats.samplesDistributed) * 100) : 0}%
              </div>
              <div style={{ fontSize: '7px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reviewed
              </div>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div style={{ flex: '1.2', height: '100%' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginBottom: '6px', fontFamily: 'Outfit', fontWeight: '600' }}>
              Distributions by City
            </p>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Recent Distributions List */}
      <div className="card" style={{ padding: '16px', marginBottom: '8px' }}>
        <div className="section-title">
          <span>Recent Distributions</span>
          <span className="section-link" onClick={() => onNavigate('samplings')}>
            View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle' }} />
          </span>
        </div>

        <div className="recent-list">
          {recent.distributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#6b7280' }}>
              No distributions logged yet.
            </div>
          ) : (
            recent.distributions.slice(0, 3).map((item) => (
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

      {/* Recent Reviews/Comments List */}
      <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
        <h3 className="section-title">
          <span>Recent Field Reviews</span>
        </h3>

        <div className="recent-list">
          {recent.reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '12px', color: '#6b7280' }}>
              No reviews received yet.
            </div>
          ) : (
            recent.reviews.slice(0, 2).map((item) => (
              <div key={item._id} className="recent-item" style={{ cursor: 'default' }}>
                <div className="recent-avatar" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <MessageSquare size={14} />
                </div>
                <div className="recent-info">
                  <div className="recent-name" style={{ color: '#10b981', fontSize: '12px' }}>
                    {item.shopName}
                  </div>
                  <p style={{ fontSize: '11px', color: '#e5e7eb', marginTop: '2px', fontStyle: 'italic' }}>
                    "{item.comment}"
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
