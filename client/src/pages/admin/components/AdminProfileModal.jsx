import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Shield, Users, BookOpen, BarChart3, Settings, Clock } from 'lucide-react';
import Modal from './Modal';

export default function AdminProfileModal({ show, onClose }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: { value: 0, change: '+0%' },
    activeCourses: { value: 0, change: '+0%' },
    totalEnrollments: { value: 0, change: '+0%' }
  });

  useEffect(() => {
    if (show && !dataLoaded) {
      fetchProfile();
    }
  }, [show, user, dataLoaded]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch admin statistics
      let stats = {
        totalUsers: { value: 0, change: '+0%' },
        activeCourses: { value: 0, change: '+0%' },
        totalEnrollments: { value: 0, change: '+0%' }
      };
      
      try {
        const adminStatsData = await api('/admin/stats');
        stats = adminStatsData;
        setAdminStats(stats);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
      
      // Build admin profile data
      const profileData = {
        admin_id: user?.admin_id || user?.user_id,
        name: user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user?.username || 'Administrator',
        email: user?.email || null,
        phone: null, // Not in database
        office: null, // Not in database
        department: 'System Administration', // Default for admin
        bio: null, // Not in database
        specialization: user?.admin_level || 'System Administrator',
        joined_date: user?.created_at || null,
        last_login: user?.last_login || null,
        admin_level: user?.admin_level || 'admin',
        permissions: user?.permissions || ['full_access'],
        // System statistics
        total_users: stats.totalUsers?.value || 0,
        active_courses: stats.activeCourses?.value || 0,
        total_enrollments: stats.totalEnrollments?.value || 0
      };
      
      setProfile(profileData);
      setFormData(profileData);
      setDataLoaded(true);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(profile);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // In a real app, you'd call: await api(`/admin/${profile.admin_id}`, 'PUT', formData);
      setProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAdminLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'super_admin':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'admin':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'moderator':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getAdminLevelDisplayName = (level) => {
    switch (level?.toLowerCase()) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'moderator':
        return 'Moderator';
      default:
        return 'Admin User';
    }
  };

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  // Reset editing state when modal is opened
  useEffect(() => {
    if (show) {
      setEditing(false);
    }
  }, [show]);

  if (loading && !profile) {
    return (
      <Modal show={show} onClose={handleClose} title="Admin Profile" size="xl">
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Loading profile...</span>
        </div>
      </Modal>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Modal show={show} onClose={handleClose} title="" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-gray-600" />
              </div>
              <div className="text-white">
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="text-2xl font-bold bg-transparent border-b-2 border-white/50 focus:border-white outline-none"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                )}
                <p className="text-lg opacity-90 mt-1">Administrator</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getAdminLevelColor(profile.admin_level)}`}>
                    {getAdminLevelDisplayName(profile.admin_level)}
                  </div>
                  {editing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="text-sm bg-transparent border-b border-white/50 focus:border-white outline-none"
                    />
                  ) : (
                    <p className="text-sm opacity-80">{profile.department}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.email || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-green-400" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400">Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400">Office</label>
                    {editing ? (
                      <input
                        type="text"
                        name="office"
                        value={formData.office}
                        onChange={handleInputChange}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white text-sm">{profile.office || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400">Joined</label>
                    <p className="text-white text-sm">
                      {profile.joined_date ? new Date(profile.joined_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      }) : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrative Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Administrative Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Specialization</label>
                  {editing ? (
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white text-sm">{profile.specialization || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bio</label>
                  {editing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                    />
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed">{profile.bio || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* System Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">System Overview</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">{profile.total_users}</div>
                  <div className="text-gray-400 text-xs">Total Users</div>
                  <div className="text-xs text-green-400">{adminStats.totalUsers?.change}</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{profile.active_courses}</div>
                  <div className="text-gray-400 text-xs">Active Courses</div>
                  <div className="text-xs text-green-400">{adminStats.activeCourses?.change}</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">{profile.total_enrollments}</div>
                  <div className="text-gray-400 text-xs">Enrollments</div>
                  <div className="text-xs text-green-400">{adminStats.totalEnrollments?.change}</div>
                </div>
              </div>
            </div>

            {/* Administrative Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Administrative Timeline</h3>
              <div className="bg-gray-600/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="w-4 h-4 text-blue-400" />
                      <p className="font-medium text-sm">Administrative Experience</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {profile.joined_date ? 
                        `${Math.floor((new Date() - new Date(profile.joined_date)) / (1000 * 60 * 60 * 24 * 365.25))} years as administrator` :
                        'Administrative tenure not available'
                      }
                    </p>
                  </div>
                  <div className="text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <p className="font-medium text-sm">Access Level</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {getAdminLevelDisplayName(profile.admin_level)} with full system access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
