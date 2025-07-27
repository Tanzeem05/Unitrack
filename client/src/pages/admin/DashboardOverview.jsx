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
    user_type: 'student',
    admin_level: '',
    specialization: '',
    batch_year: ''
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success, error, info
  
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
      // Prepare the form data with role-specific fields
      const userData = {
        username: userForm.username,
        password: userForm.password,
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        user_type: userForm.user_type
      };

      // Add role-specific fields
      if (userForm.user_type === 'admin') {
        userData.admin_level = userForm.admin_level;
      } else if (userForm.user_type === 'teacher') {
        userData.specialization = userForm.specialization;
      } else if (userForm.user_type === 'student') {
        userData.batch_year = userForm.batch_year;
      }

      await api('/users/register', 'POST', userData);
      
      // Reset form and close modal
      setUserForm({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        user_type: 'student',
        admin_level: '',
        specialization: '',
        batch_year: ''
      });
      setShowUserModal(false);
      
      setMessage({ text: 'User created successfully!', type: 'success' });
      // Auto-hide message after 3 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ text: 'Error creating user: ' + error.message, type: 'error' });
      // Auto-hide error message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
      
      setMessage({ text: 'Course created successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error creating course:', error);
      setMessage({ text: 'Error creating course: ' + error.message, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
      
      setMessage({ text: 'Announcement sent successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      // Refresh dashboard data
      window.location.reload(); // Simple refresh for now
      
    } catch (error) {
      console.error('Error sending announcement:', error);
      setMessage({ text: 'Error sending announcement: ' + error.message, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
    return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created': return '👤';
      case 'course_created': return '📚';
      case 'announcement': return '📢';
      case 'enrollment': return '✏️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  const statsArray = [
    { title: 'Active Courses', value: stats.activeCourses.value, change: stats.activeCourses.change, color: 'from-red-500 to-red-600' },
    { title: 'Total Users', value: stats.totalUsers.value, change: stats.totalUsers.change, color: 'from-blue-500 to-blue-600' },
    { title: 'Total Enrollments', value: stats.totalEnrollments.value, change: stats.totalEnrollments.change, color: 'from-green-500 to-green-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-400' 
            : message.type === 'error'
            ? 'bg-red-500 bg-opacity-20 border-red-500 text-red-400'
            : 'bg-blue-500 bg-opacity-20 border-blue-500 text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>
              {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage({ text: '', type: '' })}
              className="ml-auto text-current hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="flex gap-6">
        {/* Active Courses - Large Card (2/3 width) */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-300">{statsArray[0].title}</h3>
              <p className="text-3xl font-bold text-white mt-2">{statsArray[0].value}</p>
              <p className={`text-sm mt-2 ${
                statsArray[0].change.includes('+') ? 'text-green-400' : 'text-red-400'
              }`}>
                {statsArray[0].change} from last month
              </p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${statsArray[0].color} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xl">📊</span>
            </div>
          </div>
        </div>

        {/* Right Side Cards - Total Users and Total Enrollments */}
        <div className="flex flex-col gap-6 w-1/3">
          {/* Total Users Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">{statsArray[1].title}</h3>
                <p className="text-3xl font-bold text-white mt-2">{statsArray[1].value}</p>
                <p className={`text-sm mt-2 ${
                  statsArray[1].change.includes('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {statsArray[1].change} from last month
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${statsArray[1].color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>

          {/* Total Enrollments Card */}
          <div 
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 cursor-pointer hover:bg-gray-750"
            onClick={() => setShowEnrollmentDetails(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">{statsArray[2].title}</h3>
                <p className="text-3xl font-bold text-white mt-2">{statsArray[2].value}</p>
                <p className={`text-sm mt-2 ${
                  statsArray[2].change.includes('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {statsArray[2].change} from last month
                </p>
                <p className="text-xs text-blue-400 mt-1">Click to view details</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${statsArray[2].color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
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
              Activity Log
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'Active' 
                        ? 'bg-green-600 text-white border border-green-500' 
                        : 'bg-yellow-600 text-white border border-yellow-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{user.join_date}</td>
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
          
          {/* Role-specific fields */}
          {userForm.user_type === 'admin' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Admin Level</label>
              <select 
                name="admin_level"
                value={userForm.admin_level}
                onChange={handleUserFormChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Admin Level</option>
                <option value="super">Super Admin</option>
                <option value="basic">Basic Admin</option>
              </select>
            </div>
          )}
          
          {userForm.user_type === 'teacher' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Specialization</label>
              <input 
                type="text" 
                name="specialization"
                value={userForm.specialization}
                onChange={handleUserFormChange}
                placeholder="e.g., Computer Science, Mathematics"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          
          {userForm.user_type === 'student' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Batch Year</label>
              <input 
                type="text" 
                name="batch_year"
                value={userForm.batch_year}
                onChange={handleUserFormChange}
                placeholder="e.g., 2024, Spring 2024, Fall 2023"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
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
