import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, getCurrentCourses, getCompletedCourses } from '../../utils/api';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, GraduationCap, BookOpen, Lock, Eye, EyeOff } from 'lucide-react';

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [courseStats, setCourseStats] = useState({
    current_courses: 0,
    completed_courses: 0,
    credits_earned: null
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch fresh user data from the server to ensure we have the latest information
      let currentUser = user;
      if (user?.username) {
        try {
          const freshUserData = await api(`/users/username/${user.username}`);
          currentUser = freshUserData;
        } catch (error) {
          console.error('Error fetching fresh user data:', error);
          // Fall back to context user data if API call fails
          currentUser = user;
        }
      }
      
      // Fetch course stats
      let stats = { current_courses: 0, completed_courses: 0, credits_earned: null };
      if (currentUser?.username) {
        try {
          const [currentCoursesData, completedCoursesData] = await Promise.all([
            getCurrentCourses(currentUser.username).catch((error) => {
              if (error.message.includes('No current courses found')) return [];
              throw error;
            }),
            getCompletedCourses(currentUser.username).catch((error) => {
              if (error.message.includes('No past courses found')) return [];
              throw error;
            })
          ]);

          stats = {
            current_courses: Array.isArray(currentCoursesData) ? currentCoursesData.length : 0,
            completed_courses: Array.isArray(completedCoursesData) ? completedCoursesData.length : 0,
            credits_earned: null
          };
          setCourseStats(stats);
        } catch (error) {
          console.error('Error fetching course stats:', error);
        }
      }
      
      // Build profile data using fresh user data
      const profileData = {
        student_id: currentUser?.student_id || currentUser?.user_id,
        name: currentUser?.first_name && currentUser?.last_name 
          ? `${currentUser.first_name} ${currentUser.last_name}` 
          : currentUser?.username || 'User',
        email: currentUser?.email || null,
        phone: currentUser?.phone || null, // Now fetched fresh from database
        major: null, // Not in database
        year: null, // Not in database - batch_year exists but different format
        batch_year: currentUser?.batch_year || null, // From Students table
        gpa: null, // Not in database
        address: null, // Not in database
        bio: null, // Not in database
        enrolled_date: currentUser?.created_at || null, // From Users table
        current_courses: stats.current_courses, // From API
        completed_courses: stats.completed_courses, // From API
        credits_earned: null // Not in database - would need to be calculated
      };
      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      
      // Validate phone number format if provided
      if (formData.phone && formData.phone.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
          alert('Please enter a valid phone number');
          return;
        }
      }

      // Validate email format
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          alert('Please enter a valid email address');
          return;
        }
      }
      
      // Make API call to update profile
      const updatedUserResponse = await api(`/users/${profile.student_id}`, 'PUT', {
        email: formData.email,
        phone: formData.phone,
        first_name: formData.name ? formData.name.split(' ')[0] : '',
        last_name: formData.name ? formData.name.split(' ').slice(1).join(' ') : ''
      });
      
      // Update the profile state
      setProfile(formData);
      
      // Update the user context with fresh data to keep it in sync
      if (updatedUserResponse.user) {
        const updatedUser = {
          ...user,
          email: updatedUserResponse.user.email,
          phone: updatedUserResponse.user.phone,
          first_name: updatedUserResponse.user.first_name,
          last_name: updatedUserResponse.user.last_name
        };
        setUser(updatedUser);
      }
      
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      
      // Call API to change password
      await api('/auth/change-password', 'POST', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
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
        <div className="flex gap-3">
          {!editing ? (
            <>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </>
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
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-gray-600" />
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
              <p className="text-xl opacity-90 mt-2">Student</p>
              <div className="flex items-center gap-4 mt-2">
                {editing ? (
                  <>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      className="text-lg bg-transparent border-b border-white/50 focus:border-white outline-none"
                    />
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="text-lg bg-transparent border-b border-white/50 focus:border-white outline-none w-24"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-lg opacity-80">{profile.major || 'Not provided'}</p>
                    {profile.year && profile.major && <span className="text-lg opacity-80">•</span>}
                    {profile.year && <p className="text-lg opacity-80">{profile.year}</p>}
                    {profile.batch_year && !profile.year && (
                      <p className="text-lg opacity-80">Batch {profile.batch_year}</p>
                    )}
                  </>
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
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
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
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Address</label>
                  {editing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.address || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">Enrolled</label>
                  <p className="text-white">
                    {profile.enrolled_date ? new Date(profile.enrolled_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    }) : 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <label className="block text-sm text-gray-400">GPA</label>
                  {editing ? (
                    <input
                      type="text"
                      name="gpa"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{profile.gpa || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
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

          {/* Academic Statistics */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Academic Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{profile.current_courses || '0'}</div>
                <div className="text-gray-400">Current Courses</div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{profile.completed_courses || '0'}</div>
                <div className="text-gray-400">Completed Courses</div>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{profile.credits_earned || '0'}</div>
                <div className="text-gray-400">Credits Earned</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{profile.gpa || 'N/A'}</div>
                <div className="text-gray-400">GPA</div>
              </div>
            </div>
          </div>

          {/* Academic Timeline */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Academic Timeline</h3>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">
                  <p className="font-medium">Expected Graduation</p>
                  <p className="text-sm text-gray-400">
                    {profile.enrolled_date ? 
                      new Date(new Date(profile.enrolled_date).getFullYear() + 4, 4).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      }) : 'Not available'
                    }
                  </p>
                </div>
                <div className="text-gray-300 text-right">
                  <p className="font-medium">Years Completed</p>
                  <p className="text-sm text-gray-400">
                    {profile.enrolled_date ? 
                      `${new Date().getFullYear() - new Date(profile.enrolled_date).getFullYear()} of 4 years` :
                      'Not available'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Change Password</h3>
              <button
                onClick={handleCancelPasswordChange}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters long</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  disabled={changingPassword}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
