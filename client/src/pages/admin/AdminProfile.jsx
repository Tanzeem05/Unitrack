import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Shield, Users, BookOpen, BarChart3, Settings, Clock } from 'lucide-react';

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: { value: 0, change: '+0%' },
    activeCourses: { value: 0, change: '+0%' },
    totalEnrollments: { value: 0, change: '+0%' }
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">My Profile</h2>
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
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-gray-600" />
            </div>
            <div className="text-white">
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-3xl font-bold bg-transparent border-b-2 border-white/50 focus:border-white outline-none"
                />
              ) : (
                <h1 className="text-3xl font-bold">{profile.name}</h1>
              )}
              <p className="text-xl opacity-90 mt-2">Administrator</p>
              <div className="flex items-center gap-3 mt-2">
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getAdminLevelColor(profile.admin_level)}`}>
                  {getAdminLevelDisplayName(profile.admin_level)}
                </div>
                {editing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="text-lg bg-transparent border-b border-white/50 focus:border-white outline-none"
                  />
                ) : (
                  <p className="text-lg opacity-80">{profile.department}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8 space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Email</label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.email || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Office</label>
                  {editing ? (
                    <input
                      type="text"
                      name="office"
                      value={formData.office}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.office || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Joined</label>
                  <p className="text-white">
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
            <h3 className="text-xl font-semibold text-white mb-4">Administrative Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Specialization</label>
                {editing ? (
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.specialization || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  />
                ) : (
                  <p className="text-gray-300 leading-relaxed">{profile.bio || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Administrative Statistics */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{profile.total_users}</div>
                <div className="text-gray-400 mb-1">Total Users</div>
                <div className="text-sm text-green-400">{adminStats.totalUsers?.change}</div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{profile.active_courses}</div>
                <div className="text-gray-400 mb-1">Active Courses</div>
                <div className="text-sm text-green-400">{adminStats.activeCourses?.change}</div>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{profile.total_enrollments}</div>
                <div className="text-gray-400 mb-1">Total Enrollments</div>
                <div className="text-sm text-green-400">{adminStats.totalEnrollments?.change}</div>
              </div>
            </div>
          </div>

          {/* Administrative Timeline */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Administrative Timeline</h3>
            <div className="bg-gray-700/50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <p className="font-medium">Administrative Experience</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    {profile.joined_date ? 
                      `${Math.floor((new Date() - new Date(profile.joined_date)) / (1000 * 60 * 60 * 24 * 365.25))} years as administrator` :
                      'Administrative tenure not available'
                    }
                  </p>
                </div>
                <div className="text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <p className="font-medium">Access Level</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    {getAdminLevelDisplayName(profile.admin_level)} with full system access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
