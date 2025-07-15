import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, getCurrentCourses, getCompletedCourses } from '../../utils/api';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, GraduationCap, BookOpen } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
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

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch course stats first
      let stats = { current_courses: 0, completed_courses: 0, credits_earned: null };
      if (user?.username) {
        try {
          const [currentCoursesData, completedCoursesData] = await Promise.all([
            getCurrentCourses(user.username).catch((error) => {
              if (error.message.includes('No current courses found')) return [];
              throw error;
            }),
            getCompletedCourses(user.username).catch((error) => {
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
      
      // For now, we'll use the user data from context
      // In a real app, you'd fetch from /api/students/:id
      const profileData = {
        student_id: user?.student_id || user?.user_id,
        name: user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user?.username || 'User',
        email: user?.email || null,
        phone: null, // Not in database
        major: null, // Not in database
        year: null, // Not in database - batch_year exists but different format
        batch_year: user?.batch_year || null, // From Students table
        gpa: null, // Not in database
        address: null, // Not in database
        bio: null, // Not in database
        enrolled_date: user?.created_at || null, // From Users table
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
      // In a real app, you'd call: await api(`/students/${profile.student_id}`, 'PUT', formData);
      setProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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
    </div>
  );
}
