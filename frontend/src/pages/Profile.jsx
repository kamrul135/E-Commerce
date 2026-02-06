import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { email, ...updateData } = profileData;
      const { data } = await authAPI.updateProfile(updateData);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password,
      });
      toast.success('Password changed');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '700px' }}>
        <div className="page-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} /> Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profileData.email} disabled style={{ opacity: 0.6 }} />
              <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Your shipping address"
                rows={3}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                placeholder="Min. 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Lock size={16} /> {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
