import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, Calendar, CreditCard, ShieldCheck, Lock, Upload, LogOut, Check } from 'lucide-react';

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
  const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
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
      setShowPasswordDrawer(false);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2.5px solid rgba(255, 82, 82, 0.1)',
          borderTopColor: '#ff5252',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Profile Banner */}
      <div className="card profile-header-card" style={{ marginBottom: '8px' }}>
        <div className="profile-avatar-container">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt="User Avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </div>
          )}
          
          <label className="profile-avatar-upload">
            <Upload size={12} />
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

        <h3 className="profile-username">{profile?.name || 'AAM User'}</h3>
        <p className="profile-role">@{profile?.username || 'user'}</p>
      </div>

      {/* Profile Details Card */}
      <div className="card" style={{ padding: '16px', marginBottom: '8px' }}>
        <div className="section-title">
          <span>Personal Information</span>
          <span 
            className="section-link" 
            onClick={() => {
              if (isEditing) {
                // Cancel
                setIsEditing(false);
                fetchProfile();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? 'Cancel' : 'Edit Info'}
          </span>
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">First Name</label>
                <input
                  type="text"
                  className="form-control no-icon"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">Last Name</label>
                <input
                  type="text"
                  className="form-control no-icon"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="form-control no-icon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">CNIC Number</label>
              <input
                type="text"
                className="form-control no-icon"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                disabled={saving}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control no-icon"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">Gender</label>
                <select
                  className="form-control no-icon"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={saving}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid var(--card-border)', borderRadius: '12px', height: '45px' }}
                >
                  <option value="Male" style={{ background: '#161826' }}>Male</option>
                  <option value="Female" style={{ background: '#161826' }}>Female</option>
                  <option value="Other" style={{ background: '#161826' }}>Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">City</label>
                <input
                  type="text"
                  className="form-control no-icon"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '0' }}>
                <label className="input-label">State</label>
                <input
                  type="text"
                  className="form-control no-icon"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Address</label>
              <input
                type="text"
                className="form-control no-icon"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label className="input-label">ZIP Code</label>
              <input
                type="text"
                className="form-control no-icon"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                disabled={saving}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px', fontSize: '13px' }} disabled={saving}>
              {saving ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: '#9ca3af', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>CNIC Card</span>
                <strong>{profile?.cnic || 'Not Specified'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <Phone size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: '#9ca3af', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Mobile Phone</span>
                <strong>{profile?.phone || 'Not Specified'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: '#9ca3af', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Birth Date / Gender</span>
                <strong>{profile?.birthDate || 'N/A'} • {profile?.gender || 'Male'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ color: '#9ca3af', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Location Profile</span>
                <strong>{profile?.address ? `${profile.address}, ` : ''}{profile?.city || 'No City'}{profile?.state ? `, ${profile.state}` : ''}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings Card */}
      <div className="card" style={{ padding: '16px', marginBottom: '0' }}>
        <h3 className="section-title">
          <span>Security Options</span>
        </h3>

        {!showPasswordDrawer ? (
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setShowPasswordDrawer(true)}
            style={{ display: 'flex', gap: '8px', padding: '10px 14px', fontSize: '13px' }}
          >
            <Lock size={14} /> Change Account Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group" style={{ marginBottom: '0' }}>
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="form-control no-icon"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={passwordSubmitting}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '4px' }}>
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="form-control no-icon"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={passwordSubmitting}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: '1', padding: '10px 14px', fontSize: '13px' }} 
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? 'Updating...' : 'Update Password'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowPasswordDrawer(false);
                  setOldPassword('');
                  setNewPassword('');
                }} 
                style={{ flex: '0.6', padding: '10px 14px', fontSize: '13px' }}
                disabled={passwordSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}

export default Profile;
