import React, { useState, useEffect } from 'react';
import {
  Users, MapPin, ArrowRight, MessageSquare, Clock, ShieldCheck, Compass,
  Image as ImageIcon, ExternalLink, Building2
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const INK = '#a3abbd';
const INK_MUTED = '#6b7488';
const BRAND = '#22d3ee';
const TRACK = 'rgba(255, 255, 255, 0.06)';
const SURFACE = '#111524';

const TOOLTIP = {
  backgroundColor: '#0c0f1a',
  titleColor: '#f2f4f8',
  bodyColor: '#a3abbd',
  borderColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
  titleFont: { family: 'Outfit', size: 12, weight: '700' },
  bodyFont: { family: 'Inter', size: 12 }
};

const visitDateOf = (item) =>
  item.visitDate || item.date || (item.createdAt ? item.createdAt.slice(0, 10) : '');

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Some stored photo URLs are dead; fall back to an icon rather than a blank box.
function VisitThumb({ item }) {
  const [broken, setBroken] = useState(false);
  const src = item.images?.[0];

  if (!src || broken) return <Building2 size={17} />;

  return (
    <img
      src={src}
      alt=""
      style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }}
      onError={() => setBroken(true)}
    />
  );
}

function Dashboard({ token, onNavigate, showToast }) {
  const [stats, setStats] = useState({ areaVisited: 0, samplesDistributed: 0, reviewReceived: 0, withPhotos: 0 });
  const [recent, setRecent] = useState({ areas: [], distributions: [], reviews: [] });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, recentRes, citiesRes] = await Promise.all([
          fetch('/api/sampling-stats', { headers }),
          fetch('/api/sampling-recent', { headers }),
          fetch('/api/mechanics/cities', { headers })
        ]);

        if (!statsRes.ok || !recentRes.ok) throw new Error('Failed to load dashboard data');

        setStats(await statsRes.json());
        setRecent(await recentRes.json());
        setCities(citiesRes.ok ? await citiesRes.json() : []);
      } catch (err) {
        console.error(err);
        showToast('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="muted">Loading dashboard…</p>
      </div>
    );
  }

  const { samplesDistributed, reviewReceived, areaVisited, withPhotos = 0 } = stats;
  const reviewedPct = samplesDistributed > 0 ? Math.round((reviewReceived / samplesDistributed) * 100) : 0;
  const pending = Math.max(0, samplesDistributed - reviewReceived);

  // Progress ring: a single ratio, so the number is the headline and the ring
  // is its frame — not a two-category comparison.
  const ringData = {
    labels: ['Reviewed', 'Pending'],
    datasets: [{
      data: [reviewReceived, pending],
      backgroundColor: [BRAND, TRACK],
      borderColor: SURFACE,
      borderWidth: 2,
      hoverBackgroundColor: [BRAND, 'rgba(255,255,255,0.1)']
    }]
  };

  const ringOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP,
        callbacks: {
          label: (c) => `${c.label}: ${c.parsed.toLocaleString()} mechanics`
        }
      }
    }
  };

  // Top cities across the WHOLE collection (server aggregate), not just the
  // most recent handful of records. The long tail is summarised in the caption
  // rather than plotted — an "Other" bar here outweighs every real city and
  // flattens the comparison the chart exists to make.
  const TOP_N = 10;
  const chartCities = cities.slice(0, TOP_N);
  const shownCount = chartCities.reduce((sum, c) => sum + c.count, 0);
  const tailCities = Math.max(0, cities.length - TOP_N);

  const cityData = {
    labels: chartCities.map((c) => c.city),
    datasets: [{
      label: 'Mechanics',
      data: chartCities.map((c) => c.count),
      backgroundColor: BRAND,
      hoverBackgroundColor: '#67e8f9',
      borderRadius: 4,
      borderSkipped: false,
      barThickness: 14
    }]
  };

  const cityOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 28 } },
    plugins: {
      legend: { display: false }, // single series — the title names it
      tooltip: {
        ...TOOLTIP,
        callbacks: { label: (c) => `${c.parsed.x.toLocaleString()} mechanics` }
      }
    },
    scales: {
      x: {
        border: { display: false },
        grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
        ticks: { color: INK_MUTED, font: { family: 'Inter', size: 11 }, precision: 0 }
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: INK,
          font: { family: 'Noto Naskh Arabic, Inter', size: 12 },
          crossAlign: 'far'
        }
      }
    }
  };

  const currentVisit = recent.distributions[0] || null;
  const recentVisits = recent.distributions.slice(1, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><Users size={22} /></div>
          <div className="stat-details">
            <div className="stat-value">{samplesDistributed.toLocaleString()}</div>
            <div className="stat-label">Total Mechanics</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><ShieldCheck size={22} /></div>
          <div className="stat-details">
            <div className="stat-value">{reviewReceived.toLocaleString()}</div>
            <div className="stat-label">With Remarks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><MapPin size={22} /></div>
          <div className="stat-details">
            <div className="stat-value">{areaVisited.toLocaleString()}</div>
            <div className="stat-label">Cities Covered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><ImageIcon size={22} /></div>
          <div className="stat-details">
            <div className="stat-value">{withPhotos.toLocaleString()}</div>
            <div className="stat-label">With Photos</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 18 }}>
              <span>Coverage by city</span>
              <span className="section-link" onClick={() => onNavigate('samplings')}>
                View registry <ArrowRight size={12} />
              </span>
            </div>

            {cities.length === 0 ? (
              <p className="muted">No city data recorded yet.</p>
            ) : (
              <>
                <p className="muted" style={{ marginBottom: 14 }}>
                  Top {chartCities.length} of {cities.length} cities · {shownCount.toLocaleString()} mechanics shown
                  {tailCities > 0 && <> · {tailCities} smaller cities not plotted</>}
                </p>
                <div style={{ height: Math.max(200, chartCities.length * 30) }}>
                  <Bar data={cityData} options={cityOptions} />
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 18 }}>
              <span>Recent field remarks</span>
            </div>

            <div className="recent-list">
              {recent.reviews.length === 0 ? (
                <p className="muted">No remarks received yet.</p>
              ) : (
                recent.reviews.slice(0, 4).map((item) => (
                  <div key={item._id} className="recent-item" onClick={() => onNavigate('samplings')}>
                    <div className="recent-avatar"><MessageSquare size={17} /></div>
                    <div className="recent-info">
                      <div className="recent-name" dir="auto">
                        {item.contactPerson || item.name || item.shopName || 'Mechanic'}
                      </div>
                      <p
                        dir="auto"
                        style={{
                          fontSize: 12.5, color: 'var(--text-2)', marginTop: 3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.comment}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Review coverage — one ratio, so the number leads */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="section-title" style={{ marginBottom: 16, justifyContent: 'center' }}>
              <span>Review coverage</span>
            </div>

            <div style={{ position: 'relative', height: 190 }}>
              <Doughnut data={ringData} options={ringOptions} />
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  fontFamily: 'Outfit', fontSize: 38, fontWeight: 800,
                  color: BRAND, lineHeight: 1, letterSpacing: '-0.02em'
                }}>
                  {reviewedPct}%
                </div>
                <div style={{
                  fontSize: 10.5, color: INK_MUTED, textTransform: 'uppercase',
                  letterSpacing: '0.09em', fontWeight: 700, marginTop: 6
                }}>
                  Reviewed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 14, fontSize: 12.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                <i style={{ width: 9, height: 9, borderRadius: 3, background: BRAND }} />
                Reviewed <strong style={{ color: 'var(--text)' }}>{reviewReceived.toLocaleString()}</strong>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                <i style={{ width: 9, height: 9, borderRadius: 3, background: 'rgba(255,255,255,0.16)' }} />
                Pending <strong style={{ color: 'var(--text)' }}>{pending.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          <div className="current-visit-card">
            <div className="current-visit-header">
              <span className="pulse-indicator" />
              <h3>Latest visit</h3>
            </div>

            {currentVisit ? (
              <div className="current-visit-body">
                <div style={{ fontFamily: 'Outfit', fontSize: 19, fontWeight: 800 }} dir="auto">
                  {currentVisit.shopName?.trim() || 'Unnamed shop'}
                </div>
                <div
                  dir="auto"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: BRAND, fontWeight: 600 }}
                >
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>{[currentVisit.city?.trim(), currentVisit.address?.trim()].filter(Boolean).join(' · ') || 'No location'}</span>
                </div>

                <div className="info-tile">
                  <span className="info-tile-label"><Clock size={10} /> Visit date</span>
                  <div className="info-tile-value">{formatDate(visitDateOf(currentVisit)) || 'Not recorded'}</div>
                </div>

                {currentVisit.location?.lat != null && (
                  <div className="info-tile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="info-tile-label"><Compass size={10} /> Coordinates</span>
                      <div className="info-tile-value td-mono" style={{ fontSize: 12 }}>
                        {currentVisit.location.lat.toFixed(5)}, {currentVisit.location.lon?.toFixed(5)}
                      </div>
                    </div>
                    <a
                      className="btn btn-primary btn-sm"
                      href={`https://www.google.com/maps/search/?api=1&query=${currentVisit.location.lat},${currentVisit.location.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={12} /> Map
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted">No visits logged.</p>
            )}
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>
              <span>Recent visits</span>
              <span className="section-link" onClick={() => onNavigate('samplings')}>
                View all <ArrowRight size={12} />
              </span>
            </div>

            <div className="recent-list">
              {recentVisits.length === 0 ? (
                <p className="muted">No other visits logged.</p>
              ) : (
                recentVisits.map((item) => (
                  <div key={item._id} className="recent-item" onClick={() => onNavigate('samplings')}>
                    <div className="recent-avatar">
                      <VisitThumb item={item} />
                    </div>
                    <div className="recent-info">
                      <div className="recent-name" dir="auto">{item.shopName?.trim() || 'Unnamed shop'}</div>
                      <div className="recent-meta">
                        <span dir="auto">{item.city?.trim() || item.address?.trim() || 'Unknown'}</span>
                        <span>{formatDate(visitDateOf(item)) || '—'}</span>
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
