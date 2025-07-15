import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

// Dashboard Overview Component
const DashboardOverview = () => {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  
  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    user_type: 'student'
  });
  
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_name: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all'
  });
  
  const [teachers, setTeachers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [stats, setStats] = useState({
    totalUsers: { value: 0, change: '+0%' },
    activeCourses: { value: 0, change: '+0%' },
    totalEnrollments: { value: 0, change: '+0%' }
  });
  const [activities, setActivities] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [enrollmentsByCourse, setEnrollmentsByCourse] = useState([]);
  const [showEnrollmentDetails, setShowEnrollmentDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Test if API is available first
        try {
          const testResponse = await api('/admin/test');
          console.log('Admin API test:', testResponse);
        } catch (testErr) {
          console.warn('Admin API test failed, server may not be running:', testErr);
          // Use mock data as fallback
          setStats({
            totalUsers: { value: '0', change: '+0%' },
            activeCourses: { value: '0', change: '+0%' },
            totalEnrollments: { value: '0', change: '+0%' }
          });
          setActivities([]);
          setRecentUsers([]);
          setEnrollmentsByCourse([]);
          setError('Server is not running. Please start the backend server.');
          setLoading(false);
          return;
        }
        
        // Fetch admin statistics
        const statsData = await api('/admin/stats');
        setStats({
          totalUsers: {
            value: statsData.totalUsers.value.toLocaleString(),
            change: statsData.totalUsers.change
          },
          activeCourses: {
            value: statsData.activeCourses.value.toLocaleString(),
            change: statsData.activeCourses.change
          },
          totalEnrollments: {
            value: statsData.totalEnrollments.value.toLocaleString(),
            change: statsData.totalEnrollments.change
          }
        });

        // Fetch recent activities
        const activitiesData = await api('/admin/recent-activities');
        const formattedActivities = activitiesData.map(activity => ({
          type: activity.type,
          title: activity.title,
          description: activity.description,
          time: formatRelativeTime(activity.time),
          icon: getActivityIcon(activity.type)
        }));
        setActivities(formattedActivities);

        // Fetch recent users
        const usersData = await api('/admin/recent-users');
        setRecentUsers(usersData);

        // Fetch enrollment details by course
        const enrollmentData = await api('/admin/enrollments/by-course');
        setEnrollmentsByCourse(enrollmentData);

        // Fetch teachers for course creation
        try {
          const teachersData = await api('/admin/users?userType=teacher&limit=100');
          setTeachers(teachersData.users || []);
        } catch (err) {
          console.warn('Could not fetch teachers:', err);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check if the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Form handlers
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourseFormChange = (e) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnnouncementFormChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api('/auth/signup', 'POST', userForm);
      
      // Reset form and close modal
      setUserForm({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        user_type: 'student'
      });
      setShowUserModal(false);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get admin ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const courseData = {
        ...courseForm,
        created_by: user.admin_id || user.user_id,
        updated_by: user.admin_id || user.user_id
      };
      
      await api('/courses', 'POST', courseData);
      
      // Reset form and close modal
      setCourseForm({
        course_code: '',
        course_name: '',
        description: '',
        start_date: '',
        end_date: ''
      });
      setShowCourseModal(false);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const announcementData = {
        ...announcementForm,
        created_by: user.admin_id || user.user_id
      };
      
      await api('/global-announcements', 'POST', announcementData);
      
      // Reset form and close modal
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'normal',
        target_audience: 'all'
      });
      setShowAnnouncementModal(false);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Error sending announcement: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return '👤';
      case 'course': return '📚';
      case 'announcement': return '📢';
      case 'global_announcement': return '🌐';
      default: return '📄';
    }
  };

  const statsArray = [
    { title: 'Total Users', value: stats.totalUsers.value, change: stats.totalUsers.change, color: 'from-blue-500 to-blue-600' },
    { title: 'Active Courses', value: stats.activeCourses.value, change: stats.activeCourses.change, color: 'from-red-500 to-red-600' },
    { title: 'Total Enrollments', value: stats.totalEnrollments.value, change: stats.totalEnrollments.change, color: 'from-green-500 to-green-600' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Announcement Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-6 flex items-center gap-4">
        <span className="text-2xl">📢</span>
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">Global Announcement</h4>
          <p className="text-pink-100">System maintenance scheduled for this weekend. All users will be notified.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsArray.map((stat, index) => (
          <div 
            key={index} 
            className={`bg-gray-800 rounded-lg p-6 border border-gray-700 transition-transform ${
              stat.title === 'Total Enrollments' ? 'cursor-pointer hover:scale-105' : ''
            }`}
            onClick={stat.title === 'Total Enrollments' ? () => setShowEnrollmentDetails(true) : undefined}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change} this month
                </p>
                {stat.title === 'Total Enrollments' && (
                  <p className="text-xs text-blue-400 mt-1">Click to view details</p>
                )}
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setShowUserModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <span>👤</span>
              Add New User
            </button>
            <button 
              onClick={() => setShowCourseModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <span>📚</span>
              Create Course
            </button>
            <button 
              onClick={() => setShowAnnouncementModal(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <span>📢</span>
              Send Announcement
            </button>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span>📊</span>
              View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{activity.title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{activity.description}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium py-3">Name</th>
                <th className="text-left text-gray-400 font-medium py-3">Email</th>
                <th className="text-left text-gray-400 font-medium py-3">Role</th>
                <th className="text-left text-gray-400 font-medium py-3">Status</th>
                <th className="text-left text-gray-400 font-medium py-3">Join Date</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3 text-white">{user.name}</td>
                  <td className="py-3 text-gray-300">{user.email}</td>
                  <td className="py-3 text-gray-300">{user.role}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'Active' 
                        ? 'bg-green-500 bg-opacity-20 text-green-400' 
                        : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{user.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal show={showUserModal} onClose={() => setShowUserModal(false)} title="Add New User">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">First Name</label>
              <input 
                type="text" 
                name="first_name"
                value={userForm.first_name}
                onChange={handleUserFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
              <input 
                type="text" 
                name="last_name"
                value={userForm.last_name}
                onChange={handleUserFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input 
              type="text" 
              name="username"
              value={userForm.username}
              onChange={handleUserFormChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              value={userForm.email}
              onChange={handleUserFormChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              value={userForm.password}
              onChange={handleUserFormChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Role</label>
            <select 
              name="user_type"
              value={userForm.user_type}
              onChange={handleUserFormChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Add User'
              )}
            </button>
            <button 
              type="button"
              onClick={() => setShowUserModal(false)} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal show={showCourseModal} onClose={() => setShowCourseModal(false)} title="Create Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Course Code</label>
            <input 
              type="text" 
              name="course_code"
              value={courseForm.course_code}
              onChange={handleCourseFormChange}
              placeholder="e.g., CS101"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Course Name</label>
            <input 
              type="text" 
              name="course_name"
              value={courseForm.course_name}
              onChange={handleCourseFormChange}
              placeholder="e.g., Introduction to Computer Science"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
            <textarea 
              name="description"
              value={courseForm.description}
              onChange={handleCourseFormChange}
              placeholder="Course description..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Start Date</label>
              <input 
                type="date" 
                name="start_date"
                value={courseForm.start_date}
                onChange={handleCourseFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">End Date</label>
              <input 
                type="date" 
                name="end_date"
                value={courseForm.end_date}
                onChange={handleCourseFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </button>
            <button 
              type="button"
              onClick={() => setShowCourseModal(false)} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal show={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)} title="Send Announcement">
        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Title</label>
            <input 
              type="text" 
              name="title"
              value={announcementForm.title}
              onChange={handleAnnouncementFormChange}
              placeholder="Announcement title..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Content</label>
            <textarea 
              name="content"
              value={announcementForm.content}
              onChange={handleAnnouncementFormChange}
              placeholder="Announcement content..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
              <select 
                name="priority"
                value={announcementForm.priority}
                onChange={handleAnnouncementFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Target Audience</label>
              <select 
                name="target_audience"
                value={announcementForm.target_audience}
                onChange={handleAnnouncementFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                'Send Announcement'
              )}
            </button>
            <button 
              type="button"
              onClick={() => setShowAnnouncementModal(false)} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Target Audience</label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
              <option>All Users</option>
              <option>Students Only</option>
              <option>Instructors Only</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                'Send Announcement'
              )}
            </button>
            <button 
              type="button"
              onClick={() => setShowAnnouncementModal(false)} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrollment Details Modal */}
      <Modal show={showEnrollmentDetails} onClose={() => setShowEnrollmentDetails(false)} title="Enrollment Details by Course">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {enrollmentsByCourse.length > 0 ? (
            <div className="space-y-3">
              {enrollmentsByCourse.map((course, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{course.course_code}</h4>
                      <p className="text-gray-300 text-sm">{course.course_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {course.enrollment_count} students
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mt-3">
                    <div>
                      <span>Start:</span> {new Date(course.start_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span>End:</span> {new Date(course.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400">No enrollment data available</p>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button 
              onClick={() => setShowEnrollmentDetails(false)} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardOverview;
