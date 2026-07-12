import React, { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, Calendar, ShieldCheck, Lock, Upload, LogOut } from 'lucide-react';

function Profile({ token, onLogout, onUserUpdate, showToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [gender, setGender] = useState('Male');
  const [birthDate, setBirthDate] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setCnic(data.cnic || '');
      setGender(data.gender || 'Male');
      setBirthDate(data.birthDate || '');
      setState(data.state || '');
      setCity(data.city || '');
      setAddress(data.address || '');
      setZipCode(data.zipCode || '');
    } catch (err) {
      console.error(err);
      showToast('Error loading profile information', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Auto update profile with new image
      const updateRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileImage: data.url })
      });
      
      if (!updateRes.ok) throw new Error('Failed to save profile picture');

      setProfile(prev => ({ ...prev, profileImage: data.url }));
      showToast('Profile picture updated successfully!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Avatar upload failed', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        firstName,
        lastName,
        phone,
        cnic,
        gender,
        birthDate,
        state,
        city,
        address,
        zipCode
      };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfile(data);
      onUserUpdate(data.name); // update layout header user name
      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Profile save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please enter both passwords', 'error');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      showToast('Password changed successfully!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>Loading configuration...</p>
      </div>
    );
  }

  const userAvatarUrl = profile?.profileImage 
    ? (profile.profileImage.startsWith('http') || profile.profileImage.startsWith('/uploads') || profile.profileImage.startsWith('/tmp') ? profile.profileImage : '/api' + profile.profileImage.replace('file://', ''))
    : null;

  return (
    <div className="profile-container">
      
      {/* Left Column: Avatar & Brand Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card profile-avatar-card">
          <div className="profile-avatar-container">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="User Avatar" className="profile-avatar" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }} />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.name ? profile.name[0].toUpperCase() : 'A'}
              </div>
            )}
            
            <label className="profile-avatar-upload">
              <Upload size={14} />
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>
          </div>

          <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: '800', color: 'white', marginTop: '12px' }}>
            {profile?.name || 'AAM User'}
          </h3>
          <p className="profile-role" style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
            @{profile?.username || 'admin'}
          </p>

          <button 
            onClick={onLogout} 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '30px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <LogOut size={16} /> Sign Out of Account
          </button>
        </div>
      </div>

      {/* Right Column: Personal Information & Security */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Personal Details Card */}
        <div className="card" style={{ padding: '30px' }}>
          <div className="section-title" style={{ marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800' }}>Personal Details</span>
            <span 
              className="section-link" 
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  fetchProfile();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CNIC Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="35201-XXXXXXXX-X"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-input"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={saving}
                    style={{ height: '42px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State / Province</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving changes...' : 'Save Settings'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>

              <div className="info-row">
                <ShieldCheck size={19} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span className="form-label" style={{ marginBottom: 2 }}>CNIC</span>
                  <strong style={{ fontSize: '13.5px' }}>{profile?.cnic || 'Not specified'}</strong>
                </div>
              </div>

              <div className="info-row">
                <Phone size={19} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span className="form-label" style={{ marginBottom: 2 }}>Mobile phone</span>
                  <strong style={{ fontSize: '13.5px' }}>{profile?.phone || 'Not specified'}</strong>
                </div>
              </div>

              <div className="info-row">
                <Calendar size={19} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span className="form-label" style={{ marginBottom: 2 }}>Birth date / gender</span>
                  <strong style={{ fontSize: '13.5px' }}>
                    {profile?.birthDate || 'Not specified'}{profile?.gender ? ` • ${profile.gender}` : ''}
                  </strong>
                </div>
              </div>

              <div className="info-row" style={{ gridColumn: '1 / -1' }}>
                <MapPin size={19} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span className="form-label" style={{ marginBottom: 2 }}>Address</span>
                  <strong style={{ fontSize: '13.5px' }}>
                    {[profile?.address, profile?.city, profile?.state].filter(Boolean).join(', ') || 'Not specified'}
                  </strong>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Security Options Card */}
        <div className="card" style={{ padding: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '20px' }}>
            <span>Account Security</span>
          </h3>

          {!showPasswordForm ? (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowPasswordForm(true)}
              style={{ display: 'flex', gap: '8px' }}
            >
              <Lock size={16} /> Update Account Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  disabled={passwordSubmitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={passwordSubmitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: '1' }} 
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setOldPassword('');
                    setNewPassword('');
                  }} 
                  style={{ flex: '0.5' }}
                  disabled={passwordSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}

export default Profile;
