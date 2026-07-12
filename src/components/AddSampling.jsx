import React, { useState, useRef } from 'react';
import { Store, User, Phone, MapPin, Calendar, CheckSquare, MessageSquare, Camera, Navigation, AlertCircle } from 'lucide-react';

const DEFAULT_PRODUCTS = [
  'Tubular Battery 180Ah',
  'Tall Tubular Battery 220Ah',
  'Solar Inverter 3.2kVA',
  'Solar Inverter 5.6kVA',
  'Maintenance Free 100Ah',
  'Lithium LiFePO4 Pack 48V',
  'Solar Panel 550W Mono',
  'UPS Hybrid 1.2kVA'
];

function AddSampling({ token, onNavigate, showToast }) {
  const [shopName, setShopName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastVisitDate, setLastVisitDate] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState({ lat: '', lon: '' });
  const [images, setImages] = useState([]);
  
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Geolocation trigger
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6)
        });
        setGpsLoading(false);
        showToast('GPS coordinates acquired!');
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
        showToast('Failed to retrieve location. Enter manually.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Image upload trigger
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImages(prev => [...prev, data.url]);
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    showToast('Image removed');
  };

  const handleProductToggle = (prod) => {
    setSelectedProducts(prev => 
      prev.includes(prod) 
        ? prev.filter(p => p !== prod)
        : [...prev, prod]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName || !contactPerson || !mobile || !city) {
      showToast('Please fill out all required fields (*)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Build payload matching backend model schema
      const payload = {
        shopName,
        contactPerson,
        fatherName,
        mobile,
        email,
        address,
        city,
        visitDate,
        lastVisitDate,
        products: selectedProducts,
        comment,
        images,
        date: visitDate // backward compatibility fallback
      };

      if (location.lat && location.lon) {
        payload.location = {
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon)
        };
      }

      const res = await fetch('/api/sampling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      showToast('Sampling logged successfully!');
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: '800', marginBottom: '2px' }}>
          Log Distribution
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Record sample details and upload location photos
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Shop Detail Card */}
        <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
            <span>1. Shop Details</span>
          </h3>

          <div className="input-group">
            <label className="input-label">Shop Name *</label>
            <div className="input-wrapper">
              <Store className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Enter shop/business name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Contact Person Name *</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Full name of contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Father's Name</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Father's name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Mobile Number *</label>
              <div className="input-wrapper">
                <Phone className="input-icon" />
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +923001234567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon" style={{ fontSize: '12px', fontWeight: '800' }}>@</span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address & GPS Card */}
        <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
            <span>2. Location & Date</span>
          </h3>

          <div className="input-group">
            <label className="input-label">City *</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Lahore, Rawalpindi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Street Address</label>
            <div className="input-wrapper">
              <MapPin className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder="Shop number, market, street name"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* GPS coordinates with Auto fetch */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>GPS Coordinates</label>
              <button
                type="button"
                onClick={fetchGPS}
                className="btn btn-secondary"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  width: 'auto',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}
                disabled={gpsLoading || submitting}
              >
                <Navigation size={12} className={gpsLoading ? 'spin-icon' : ''} />
                {gpsLoading ? 'Locating...' : 'Get GPS'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                step="any"
                className="form-control no-icon"
                placeholder="Latitude"
                value={location.lat}
                onChange={(e) => setLocation(prev => ({ ...prev, lat: e.target.value }))}
                disabled={submitting}
              />
              <input
                type="number"
                step="any"
                className="form-control no-icon"
                placeholder="Longitude"
                value={location.lon}
                onChange={(e) => setLocation(prev => ({ ...prev, lon: e.target.value }))}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Visit Date</label>
              <div className="input-wrapper">
                <Calendar className="input-icon" />
                <input
                  type="date"
                  className="form-control"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Last Visit</label>
              <div className="input-wrapper">
                <Calendar className="input-icon" />
                <input
                  type="date"
                  className="form-control"
                  value={lastVisitDate}
                  onChange={(e) => setLastVisitDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products & Feedback Card */}
        <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
            <span>3. Product & Reviews</span>
          </h3>

          <div className="input-group">
            <label className="input-label">Sampled Products</label>
            <div className="checkbox-grid">
              {DEFAULT_PRODUCTS.map((prod, i) => (
                <label key={i} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(prod)}
                    onChange={() => handleProductToggle(prod)}
                    disabled={submitting}
                  />
                  <span>{prod}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '0' }}>
            <label className="input-label">Comment / Feedback</label>
            <div className="input-wrapper">
              <MessageSquare className="input-icon" style={{ top: '15px' }} />
              <textarea
                className="form-control"
                placeholder="Log customer response, requirements or comments"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
          <h3 className="section-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
            <span>4. Visit Images</span>
          </h3>

          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImageUpload}
            disabled={uploadingImage || submitting}
          />

          <div 
            className="upload-widget"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="upload-icon" />
            <div className="upload-text">
              {uploadingImage ? (
                <span>Uploading image, please wait...</span>
              ) : (
                <>Tap to <span>Upload Shop Image</span></>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div className="preview-grid">
              {images.map((img, idx) => (
                <div key={idx} className="preview-item">
                  <img src={img} alt="Sampling distribution attachment" />
                  <button
                    type="button"
                    className="preview-delete"
                    onClick={() => removeImage(idx)}
                    disabled={submitting}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: '52px', marginTop: '4px' }}
          disabled={submitting || uploadingImage}
        >
          {submitting ? 'Saving entry...' : 'Save Distribution Log'}
        </button>

      </form>
      
      {/* Geolocation keyframe spinner injection */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1.5s linear infinite;
        }
      `}</style>

    </div>
  );
}

export default AddSampling;
