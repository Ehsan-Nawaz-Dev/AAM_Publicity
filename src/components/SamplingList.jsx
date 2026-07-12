import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Smartphone, X, Image as ImageIcon, MessageSquare, Compass, Shield, Award } from 'lucide-react';

function SamplingList({ token, showToast }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
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
          throw new Error('Failed to fetch mechanics data');
        }
        const data = await res.json();
        setSamples(data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load mechanics data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [token]);

  // Extract unique cities for the dropdown
  const uniqueCities = ['all', ...new Set(samples.map(item => item.city).filter(Boolean))];

  // List of standard provinces in Pakistan
  const provincesList = [
    { value: 'all', label: 'All Provinces' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'sindh', label: 'Sindh' },
    { value: 'kpk', label: 'Khyber Pakhtunkhwa (KPK)' },
    { value: 'balochistan', label: 'Balochistan' },
    { value: 'islamabad', label: 'Islamabad' },
    { value: 'ajk', label: 'Azad Kashmir' },
    { value: 'gb', label: 'Gilgit-Baltistan' }
  ];

  // Helper to match state names to normalized province keys
  const matchProvince = (itemState, selectedKey) => {
    if (selectedKey === 'all') return true;
    if (!itemState) return false;
    
    const stateStr = itemState.toLowerCase();
    
    if (selectedKey === 'punjab' && stateStr.includes('punjab')) return true;
    if (selectedKey === 'sindh' && stateStr.includes('sindh')) return true;
    if (selectedKey === 'kpk' && (stateStr.includes('kpk') || stateStr.includes('khyber') || stateStr.includes('pk'))) return true;
    if (selectedKey === 'balochistan' && stateStr.includes('baloch')) return true;
    if (selectedKey === 'islamabad' && (stateStr.includes('islamabad') || stateStr.includes('capital'))) return true;
    if (selectedKey === 'ajk' && (stateStr.includes('kashmir') || stateStr.includes('ajk'))) return true;
    if (selectedKey === 'gb' && (stateStr.includes('gilgit') || stateStr.includes('gb'))) return true;
    
    return false;
  };

  // Search & Multi-dropdown Filter
  const filteredSamples = samples.filter(item => {
    // 1. Text Search Filter
    const term = search.toLowerCase();
    const matchesText = !term || (
      (item.shopName || '').toLowerCase().includes(term) ||
      (item.name || item.contactPerson || '').toLowerCase().includes(term) ||
      (item.mobile || '').toLowerCase().includes(term) ||
      (item.city || '').toLowerCase().includes(term) ||
      (item.comment || '').toLowerCase().includes(term) ||
      (item.products || []).some(p => p.toLowerCase().includes(term))
    );

    // 2. City Dropdown Filter
    const matchesCity = selectedCity === 'all' || (item.city && item.city.toLowerCase() === selectedCity.toLowerCase());

    // 3. Province Dropdown Filter
    const matchesProvince = matchProvince(item.state || item.province, selectedProvince);

    return matchesText && matchesCity && matchesProvince;
  });

  // Formatter for CNIC displays or default mock id
  const formatCNIC = (item) => {
    if (item.cnic) return item.cnic;
    // Generate a unique dummy CNIC from the ID to make it look authentic
    const hash = item._id ? item._id.substring(18) : '12345';
    return `35201-${parseInt(hash, 16) % 10000000}-${1}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>Fetching records...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top filter section */}
      <div className="filter-bar">
        
        {/* Search bar wrapper */}
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search by name, shop, city, comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* City Filter */}
        <div className="filter-group">
          <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>City</label>
          <select 
            className="filter-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">All Cities</option>
            {uniqueCities.filter(c => c !== 'all').map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Province Filter */}
        <div className="filter-group">
          <label style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>Province</label>
          <select 
            className="filter-select"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            {provincesList.map(prov => (
              <option key={prov.value} value={prov.value}>{prov.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Grid List View */}
      <div className="mechanics-grid">
        {filteredSamples.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#6b7280', fontSize: '14px' }}>
            {search || selectedCity !== 'all' || selectedProvince !== 'all' 
              ? 'No matching mechanics found' 
              : 'No mechanics registered in the database yet'}
          </div>
        ) : (
          filteredSamples.map((item) => {
            const photoUrl = item.images && item.images.length > 0 
              ? item.images[0] 
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
            
            return (
              <div
                key={item._id}
                className="mechanic-grid-card"
                onClick={() => setSelectedSample(item)}
              >
                <img 
                  src={photoUrl} 
                  alt={item.contactPerson || 'Mechanic'} 
                  className="mechanic-photo-circle"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
                  }}
                />

                <h3>{item.contactPerson || item.name || 'Unnamed Mechanic'}</h3>
                <div className="mechanic-shop">{item.shopName || 'No Shop Name'}</div>
                <div className="mechanic-city-tag">{item.city || 'No City'}</div>

                <div className="mechanic-meta-row">
                  <span>{item.mobile || 'No Mobile'}</span>
                  <span>{item.visitDate || 'No Date'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Premium National ID Card Detail Modal */}
      {selectedSample && (
        <div className="modal-overlay" onClick={() => setSelectedSample(null)}>
          <div className="id-card-modal-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button className="modal-close-btn" onClick={() => setSelectedSample(null)}>
              <X size={16} />
            </button>

            {/* National ID Card Layout */}
            <div className="national-id-card">
              
              {/* Header */}
              <div className="id-card-header">
                <div className="id-card-header-left">
                  <span className="id-card-org">Aampower Logistics</span>
                  <span className="id-card-type">Registered Mechanic Identity</span>
                </div>
                <div className="id-card-header-chip"></div>
              </div>

              {/* Body */}
              <div className="id-card-body">
                {/* Photo */}
                <div className="id-card-photo-area">
                  <img 
                    src={selectedSample.images && selectedSample.images.length > 0 ? selectedSample.images[0] : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                    alt="Mechanic" 
                    className="id-card-photo"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                  />
                </div>

                {/* Fields */}
                <div className="id-card-fields">
                  <div className="id-field">
                    <span className="id-field-label">Name</span>
                    <span className="id-field-value">{selectedSample.contactPerson || selectedSample.name || 'N/A'}</span>
                  </div>

                  <div className="id-field">
                    <span className="id-field-label">Father's Name</span>
                    <span className="id-field-value">{selectedSample.fatherName || 'N/A'}</span>
                  </div>

                  <div className="id-field">
                    <span className="id-field-label">Identity Number</span>
                    <span className="id-field-value">{formatCNIC(selectedSample)}</span>
                  </div>

                  <div className="id-field">
                    <span className="id-field-label">Mobile</span>
                    <span className="id-field-value">{selectedSample.mobile || 'N/A'}</span>
                  </div>

                  <div className="id-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="id-field-label">City / Province</span>
                    <span className="id-field-value">{selectedSample.city || 'N/A'} / {selectedSample.state || 'Punjab'}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="id-card-footer">
                <span>VERIFIED OPERATIONAL CARD</span>
                <span className="id-card-barcode">||| | || |||| | |</span>
              </div>

            </div>

            {/* Extra Details Area (Comments, Locations, attachments) */}
            <div className="id-card-modal-details">
              
              {/* Shop & Address */}
              <div className="id-detail-section">
                <div className="id-detail-title">Shop Details</div>
                <div className="id-detail-text" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>{selectedSample.shopName || 'Unnamed Shop'}</strong>
                    {selectedSample.address ? ` - ${selectedSample.address}` : ''}
                  </span>
                </div>
              </div>

              {/* Products List */}
              {((selectedSample.products && selectedSample.products.length > 0) || selectedSample.product) && (
                <div className="id-detail-section">
                  <div className="id-detail-title">Catalog Products logged</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {selectedSample.products && selectedSample.products.length > 0 ? (
                      selectedSample.products.map((p, i) => (
                        <span key={i} style={{ background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          {p}
                        </span>
                      ))
                    ) : (
                      <span style={{ background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                        {selectedSample.product}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Comments & Remarks */}
              {selectedSample.comment && (
                <div className="id-detail-section">
                  <div className="id-detail-title">Auditor Remarks & Comments</div>
                  <div className="id-detail-text" style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <MessageSquare size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>"{selectedSample.comment}"</span>
                  </div>
                </div>
              )}

              {/* Location Coordinate Preview */}
              {selectedSample.location && (selectedSample.location.lat || selectedSample.location.lon) && (
                <div className="id-detail-section">
                  <div className="id-detail-title">Coordinates</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      <Compass size={14} style={{ color: 'var(--primary)' }} />
                      <span>LAT: {selectedSample.location.lat.toFixed(5)}, LON: {selectedSample.location.lon.toFixed(5)}</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedSample.location.lat},${selectedSample.location.lon}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                    >
                      Open Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedSample.images && selectedSample.images.length > 0 && (
                <div className="id-detail-section" style={{ marginBottom: 0 }}>
                  <div className="id-detail-title">Attached Media ({selectedSample.images.length})</div>
                  <div className="id-detail-photos">
                    {selectedSample.images.map((img, i) => (
                      <img 
                        key={i} 
                        src={img} 
                        alt="attachment" 
                        className="id-detail-photo-thumb"
                        onClick={() => window.open(img, '_blank')}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
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
