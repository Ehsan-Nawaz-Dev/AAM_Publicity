import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Smartphone, X, Image as ImageIcon, MessageSquare } from 'lucide-react';

function SamplingList({ token, showToast }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sampling', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch samples');
        }
        const data = await res.json();
        setSamples(data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load samples', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [token]);

  // Search Filter
  const filteredSamples = samples.filter(item => {
    const term = search.toLowerCase();
    return (
      (item.shopName || '').toLowerCase().includes(term) ||
      (item.contactPerson || '').toLowerCase().includes(term) ||
      (item.mobile || '').toLowerCase().includes(term) ||
      (item.city || '').toLowerCase().includes(term) ||
      (item.product || '').toLowerCase().includes(term) ||
      (item.products || []).some(p => p.toLowerCase().includes(term))
    );
  });

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
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Fetching records...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Info */}
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: '800', marginBottom: '2px' }}>
          Sampling Entries
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Browse and inspect {samples.length} logged field distributions
        </p>
      </div>

      {/* Search Input */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="form-control no-icon"
            placeholder="Search by shop, contact, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>
      </div>

      {/* Entries List */}
      <div style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSamples.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '14px' }}>
            {search ? 'No matches found for search' : 'No samplings recorded yet'}
          </div>
        ) : (
          filteredSamples.map((item) => (
            <div
              key={item._id}
              className="card"
              onClick={() => setSelectedSample(item)}
              style={{
                padding: '16px',
                marginBottom: '0',
                cursor: 'pointer',
                background: 'rgba(25, 27, 44, 0.65)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {item.shopName || 'Unnamed Shop'}
                </h4>
                <span style={{
                  fontSize: '9px',
                  background: 'rgba(255, 82, 82, 0.12)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {item.city || 'No City'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                {item.contactPerson || 'No Contact Person'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={12} /> {item.mobile || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {item.visitDate || item.date || 'No Date'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Slide-up Modal Sheet */}
      {selectedSample && (
        <div className="modal-overlay" onClick={() => setSelectedSample(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Distribution Details</h3>
              <button className="icon-btn" onClick={() => setSelectedSample(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="modal-body-section">
                <div className="modal-label">Shop Name</div>
                <div className="modal-value" style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>
                  {selectedSample.shopName || 'Unnamed Shop'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="modal-body-section">
                  <div className="modal-label">Contact Person</div>
                  <div className="modal-value">{selectedSample.contactPerson || 'N/A'}</div>
                </div>
                <div className="modal-body-section">
                  <div className="modal-label">Father's Name</div>
                  <div className="modal-value">{selectedSample.fatherName || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="modal-body-section">
                  <div className="modal-label">Mobile Number</div>
                  <div className="modal-value" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    {selectedSample.mobile || 'N/A'}
                  </div>
                </div>
                <div className="modal-body-section">
                  <div className="modal-label">Email</div>
                  <div className="modal-value">{selectedSample.email || 'N/A'}</div>
                </div>
              </div>

              <div className="modal-body-section">
                <div className="modal-label">Address</div>
                <div className="modal-value" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--primary)' }} />
                  <span>
                    {selectedSample.address ? `${selectedSample.address}, ` : ''}
                    <strong>{selectedSample.city || 'No City'}</strong>
                  </span>
                </div>
              </div>

              {selectedSample.location && selectedSample.location.lat && selectedSample.location.lon && (
                <div className="modal-body-section">
                  <div className="modal-label">GPS Location</div>
                  <div className="modal-value" style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Lat: {selectedSample.location.lat}, Lon: {selectedSample.location.lon}
                  </div>
                  {/* Leaflet Static map approximation using OpenStreetMap tiles */}
                  <div className="mini-map">
                    <img 
                      src={`https://static-maps.yandex.ru/1.x/?ll=${selectedSample.location.lon},${selectedSample.location.lat}&z=14&size=400,120&l=map&pt=${selectedSample.location.lon},${selectedSample.location.lat},pm2rdl`} 
                      alt="Map Location" 
                      onError={(e) => {
                        e.target.onerror = null;
                        // Fallback message/icon if Yandex API fails
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="mini-map-overlay">
                      Map Preview ({selectedSample.location.lat.toFixed(4)}, {selectedSample.location.lon.toFixed(4)})
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="modal-body-section">
                  <div className="modal-label">Visit Date</div>
                  <div className="modal-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <Calendar size={12} /> {selectedSample.visitDate || 'N/A'}
                  </div>
                </div>
                <div className="modal-body-section">
                  <div className="modal-label">Last Visit Date</div>
                  <div className="modal-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <Calendar size={12} /> {selectedSample.lastVisitDate || 'N/A'}
                  </div>
                </div>
              </div>

              {((selectedSample.products && selectedSample.products.length > 0) || selectedSample.product) && (
                <div className="modal-body-section">
                  <div className="modal-label">Sampled Products</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {selectedSample.products && selectedSample.products.length > 0 ? (
                      selectedSample.products.map((p, i) => (
                        <span key={i} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                        {selectedSample.product}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {selectedSample.comment && (
                <div className="modal-body-section">
                  <div className="modal-label">Comment / Feedback</div>
                  <div className="modal-value" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <MessageSquare size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>"{selectedSample.comment}"</span>
                  </div>
                </div>
              )}

              {selectedSample.images && selectedSample.images.length > 0 && (
                <div className="modal-body-section">
                  <div className="modal-label">Attachments ({selectedSample.images.length})</div>
                  <div className="preview-grid" style={{ marginTop: '6px' }}>
                    {selectedSample.images.map((img, i) => (
                      <div key={i} className="preview-item" style={{ cursor: 'zoom-in' }} onClick={() => window.open(img, '_blank')}>
                        <img src={img} alt={`Sample ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SamplingList;
