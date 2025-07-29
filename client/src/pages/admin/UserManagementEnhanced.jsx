import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminLevelFilter, setAdminLevelFilter] = useState('all');
  const [adminLevels, setAdminLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    user_type: 'student',
    password: '',
    admin_level: '',
    specialization: '',
    batch_year: '',
    department_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchAdminLevels();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const data = await api('/admin/departments');
      console.log('Departments fetched:', data);
      console.log('Setting departments state to:', data);
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchAdminLevels = async () => {
    try {
      console.log('Fetching admin levels...');
      const data = await api('/admin/admin-levels');
      console.log('Admin levels fetched:', data);
      setAdminLevels(data);
    } catch (err) {
      console.error('Error fetching admin levels:', err);
    }
  };

  const fetchStudentDetails = async (userId) => {
    try {
      const enrollments = await api(`/admin/users/${userId}/enrollments`);
      return {
        type: 'student',
        enrollments: enrollments
      };
    } catch (err) {
      console.error('Error fetching student details:', err);
      return { type: 'student', enrollments: [], error: 'Failed to load enrollments' };
    }
  };

  const fetchTeacherDetails = async (userId) => {
    try {
      const teacherData = await api(`/admin/users/${userId}/teacher-info`);
      return {
        type: 'teacher',
        ...teacherData
      };
    } catch (err) {
      console.error('Error fetching teacher details:', err);
      return { type: 'teacher', error: 'Failed to load teacher information' };
    }
  };

  const fetchAdminDetails = async (userId) => {
    try {
      const adminData = await api(`/admin/users/${userId}/admin-info`);
      return {
        type: 'admin',
        ...adminData
      };
    } catch (err) {
      console.error('Error fetching admin details:', err);
      return { type: 'admin', error: 'Failed to load admin information' };
    }
  };

  // Debug departments state
  console.log('Current departments state:', departments);

  const fetchUsers = async (page = 1, isSearchOrFilter = false) => {
    try {
      if (isSearchOrFilter) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (roleFilter && roleFilter !== 'all') {
        params.append('userType', roleFilter);
      }
      
      if (adminLevelFilter && adminLevelFilter !== 'all' && roleFilter === 'admin') {
        params.append('adminLevel', adminLevelFilter);
      }
      
      const data = await api(`/admin/users?${params.toString()}`);
      console.log('Users API Response:', data);
      
      // Handle both array and object responses
      let usersArray = [];
      let paginationData = {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false
      };
      
      if (Array.isArray(data)) {
        // Old format - direct array response
        console.log('Using old format (direct array)');
        usersArray = data;
        paginationData.totalUsers = data.length;
      } else if (data && data.users) {
        // New format - object with users and pagination
        console.log('Using new format (paginated object)');
        console.log('Users received:', data.users);
        console.log('Pagination received:', data.pagination);
        usersArray = data.users || [];
        paginationData = data.pagination || paginationData;
      } else {
        console.warn('Unexpected response format:', data);
        usersArray = [];
      }
      
      // Map backend data structure to frontend expected structure
      const mappedUsers = usersArray.map(user => ({
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        username: user.username,
        role: user.user_type,
        status: 'Active', // Default status since backend doesn't provide this
        created_at: user.created_at,
        admin_level: user.admin_level,
        specialization: user.specialization,
        batch_year: user.batch_year,
        // Include original fields for editing
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type
      }));
      
      setUsers(mappedUsers);
      setPagination(paginationData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setUsers([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      if (isSearchOrFilter) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!showEditModal && !formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Validate role-specific fields
    if (formData.user_type === 'admin' && !formData.admin_level.trim()) {
      errors.admin_level = 'Admin level is required';
    }
    if (formData.user_type === 'teacher' && !formData.specialization.trim()) {
      errors.specialization = 'Specialization is required';
    }
    if (formData.user_type === 'student' && !formData.batch_year.trim()) {
      errors.batch_year = 'Batch year is required';
    }
    if (formData.user_type === 'student' && !formData.department_id) {
      errors.department_id = 'Department is required for students';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const newUser = await api('/admin/users', 'POST', formData);
      
      // Map the response to match frontend structure
      const mappedUser = {
        user_id: newUser.user_id,
        name: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        username: newUser.username,
        role: newUser.user_type,
        status: 'Active',
        created_at: newUser.created_at,
        admin_level: newUser.admin_level,
        specialization: newUser.specialization,
        batch_year: newUser.batch_year,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        user_type: newUser.user_type
      };
      
      setShowCreateModal(false);
      resetForm();
      // Reset to first page and refetch to show new user
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      await fetchUsers(1, false);
    } catch (err) {
      console.error('Error creating user:', err);
      setFormErrors({ submit: err.message || 'Failed to create user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const updatedUser = await api(`/admin/users/${selectedUser.user_id}`, 'PUT', formData);
      
      // Map the response to match frontend structure
      const mappedUser = {
        user_id: updatedUser.user_id,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.user_type,
        status: 'Active',
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        admin_level: updatedUser.admin_level,
        specialization: updatedUser.specialization,
        batch_year: updatedUser.batch_year,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        user_type: updatedUser.user_type
      };
      
      setShowEditModal(false);
      resetForm();
      // Refetch current page to show updated data
      await fetchUsers(pagination.currentPage || 1, false);
    } catch (err) {
      console.error('Error updating user:', err);
      setFormErrors({ submit: err.message || 'Failed to update user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setSubmitting(true);
      await api(`/admin/users/${selectedUser.user_id}`, 'DELETE');
      // Check if current page becomes empty after deletion, go to previous page
      const remainingUsers = users.length - 1;
      const currentPage = pagination.currentPage || 1;
      
      if (remainingUsers === 0 && currentPage > 1) {
        await fetchUsers(currentPage - 1, false);
      } else {
        await fetchUsers(currentPage, false);
      }
      
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      user_type: 'student',
      password: '',
      admin_level: '',
      specialization: '',
      batch_year: '',
      department_id: ''
    });
    setFormErrors({});
    setSelectedUser(null);
  };

  // Search and filter handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    // Reset admin level filter when role changes
    setAdminLevelFilter('all');
    // Reset to first page when filtering
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAdminLevelFilterChange = (e) => {
    setAdminLevelFilter(e.target.value);
    // Reset to first page when filtering
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Trigger search/filter when terms change
  useEffect(() => {
    fetchUsers(1, true); // true indicates this is a search/filter operation
  }, [searchTerm, roleFilter, adminLevelFilter]);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_type: user.user_type,
      password: '', // Don't populate password for editing
      admin_level: user.admin_level || '',
      specialization: user.specialization || '',
      batch_year: user.batch_year || '',
      department_id: user.department_id || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleRowClick = async (user) => {
    setSelectedUser(user);
    setUserDetails(null); // Reset details
    setShowUserDetailsModal(true);

    // Fetch details based on user type
    let details = null;
    switch (user.role) {
      case 'student':
        details = await fetchStudentDetails(user.user_id);
        break;
      case 'teacher':
        details = await fetchTeacherDetails(user.user_id);
        break;
      case 'admin':
        details = await fetchAdminDetails(user.user_id);
        break;
      default:
        details = { type: 'unknown', error: 'Unknown user type' };
    }
    
    setUserDetails(details);
  };

  // Since filtering is now done on the backend, we just use the users array directly
  const displayedUsers = users || [];

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-600 text-white border border-red-500';
      case 'teacher': return 'bg-blue-600 text-white border border-blue-500';
      case 'student': return 'bg-green-600 text-white border border-green-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-600 text-white border border-green-500';
      case 'inactive': return 'bg-yellow-600 text-white border border-yellow-500';
      case 'suspended': return 'bg-red-600 text-white border border-red-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  const getAdminLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'super': return 'bg-purple-600 text-white border border-purple-500';
      case 'admin': return 'bg-blue-600 text-white border border-blue-500';
      case 'moderator': return 'bg-orange-600 text-white border border-orange-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400">Manage all users in the system</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>👤</span>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Search Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          {roleFilter === 'admin' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Filter by Admin Level</label>
              <select
                value={adminLevelFilter}
                onChange={handleAdminLevelFilterChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Levels</option>
                {adminLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden relative">
        {searchLoading && (
          <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-300">Searching...</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Name</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Email</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Role</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">
                  {roleFilter === 'admin' ? 'Admin Level' : 'Status'}
                </th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Join Date</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length > 0 ? (
                displayedUsers.map((user, index) => (
                  <tr 
                    key={user.user_id} 
                    className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(user)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{user.email}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {roleFilter === 'admin' && user.role === 'admin' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdminLevelColor(user.admin_level)}`}>
                          {user.admin_level ? user.admin_level.charAt(0).toUpperCase() + user.admin_level.slice(1) : 'N/A'}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(user);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(user);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-gray-400">
                    {searchTerm || roleFilter !== 'all' ? 'No users match your search criteria' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.currentPage - 1, false)}
                disabled={!pagination.hasPrev}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and 2 pages around current
                    return page === 1 || 
                           page === pagination.totalPages || 
                           Math.abs(page - pagination.currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => fetchUsers(page, false)}
                          className={`px-3 py-2 rounded text-sm ${
                            page === pagination.currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button
                onClick={() => fetchUsers(pagination.currentPage + 1, false)}
                disabled={!pagination.hasNext}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New User" size="lg">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="john_doe"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.username ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.username && (
                <p className="text-red-400 text-xs mt-1">{formErrors.username}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.email ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="John"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.first_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.first_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.first_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                placeholder="Doe"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.last_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.last_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">User Type *</label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.password ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.password && (
                <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>
          </div>

          {/* Conditional fields based on user type */}
          {formData.user_type === 'admin' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Admin Level *</label>
              <select
                value={formData.admin_level}
                onChange={(e) => setFormData({...formData, admin_level: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.admin_level ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select Level</option>
                <option value="super">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
              {formErrors.admin_level && (
                <p className="text-red-400 text-xs mt-1">{formErrors.admin_level}</p>
              )}
            </div>
          )}

          {formData.user_type === 'teacher' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Specialization *</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="e.g., Computer Science, Mathematics"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.specialization ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.specialization && (
                <p className="text-red-400 text-xs mt-1">{formErrors.specialization}</p>
              )}
            </div>
          )}

          {formData.user_type === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Batch Year *</label>
                <input
                  type="text"
                  value={formData.batch_year}
                  onChange={(e) => setFormData({...formData, batch_year: e.target.value})}
                  placeholder="e.g., 2024"
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                    formErrors.batch_year ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {formErrors.batch_year && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.batch_year}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                    formErrors.department_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.department_id}</p>
                )}
              </div>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{formErrors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit User" size="lg">
        <form onSubmit={handleEditUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.username ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.username && (
                <p className="text-red-400 text-xs mt-1">{formErrors.username}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.email ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.first_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.first_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.first_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.last_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.last_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">User Type *</label>
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">New Password (optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Leave blank to keep current password"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.password ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.password && (
                <p className="text-red-400 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>
          </div>

          {/* Conditional fields based on user type */}
          {formData.user_type === 'admin' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Admin Level *</label>
              <select
                value={formData.admin_level}
                onChange={(e) => setFormData({...formData, admin_level: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.admin_level ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select Level</option>
                <option value="super">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
              {formErrors.admin_level && (
                <p className="text-red-400 text-xs mt-1">{formErrors.admin_level}</p>
              )}
            </div>
          )}

          {formData.user_type === 'teacher' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Specialization *</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="e.g., Computer Science, Mathematics"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.specialization ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.specialization && (
                <p className="text-red-400 text-xs mt-1">{formErrors.specialization}</p>
              )}
            </div>
          )}

          {formData.user_type === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Batch Year *</label>
                <input
                  type="text"
                  value={formData.batch_year}
                  onChange={(e) => setFormData({...formData, batch_year: e.target.value})}
                  placeholder="e.g., 2024"
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                    formErrors.batch_year ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {formErrors.batch_year && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.batch_year}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                    formErrors.department_id ? 'border-red-500' : 'border-gray-600'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {formErrors.department_id && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.department_id}</p>
                )}
              </div>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{formErrors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              type="submit"
              disabled={submitting}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
            <button 
              type="button"
              onClick={() => { setShowEditModal(false); resetForm(); }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User" size="sm">
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              ⚠️ This action cannot be undone. All user data and associated content will be permanently deleted.
            </p>
          </div>
          
          {selectedUser && (
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-white font-medium">{selectedUser.name}</p>
              <p className="text-gray-400 text-sm">{selectedUser.email}</p>
              <p className="text-gray-300 text-sm">Role: <span className={`px-2 py-1 rounded text-sm font-semibold ${getRoleColor(selectedUser.role)}`}>{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</span></p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleDeleteUser}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Deleting...' : 'Delete User'}
            </button>
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* User Details Modal */}
      <Modal show={showUserDetailsModal} onClose={() => setShowUserDetailsModal(false)} title={`${selectedUser?.name} Details`} size="lg">
        <div className="space-y-4">
          {selectedUser && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-300">{selectedUser.email}</p>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Username:</span>
                  <p className="text-white">{selectedUser.username}</p>
                </div>
                <div>
                  <span className="text-gray-400">Join Date:</span>
                  <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {userDetails === null ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">Loading details...</span>
            </div>
          ) : userDetails.error ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{userDetails.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Student Details */}
              {userDetails.type === 'student' && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                    📚 Course Enrollments
                  </h4>
                  {userDetails.enrollments && userDetails.enrollments.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.enrollments.map((enrollment, index) => (
                        <div key={index} className="bg-gray-600 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-white font-medium">{enrollment.course_name}</h5>
                              <p className="text-gray-300 text-sm">Code: {enrollment.course_code}</p>
                              <p className="text-gray-400 text-xs">
                                Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              enrollment.status === 'active' ? 'bg-green-600 text-white' : 
                              enrollment.status === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                            }`}>
                              {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1) || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No course enrollments found.</p>
                  )}
                </div>
              )}

              {/* Teacher Details */}
              {userDetails.type === 'teacher' && (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                      👨‍🏫 Teacher Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Specialization:</span>
                        <p className="text-white font-medium">{userDetails.specialization || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Teaching Since:</span>
                        <p className="text-white">{userDetails.teaching_since ? new Date(userDetails.teaching_since).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {userDetails.courses && userDetails.courses.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                        📖 Teaching Courses
                      </h4>
                      <div className="space-y-3">
                        {userDetails.courses.map((course, index) => (
                          <div key={index} className="bg-gray-600 rounded p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-white font-medium">{course.course_name}</h5>
                                <p className="text-gray-300 text-sm">Code: {course.course_code}</p>
                                <p className="text-gray-400 text-xs">
                                  Students: {course.enrollment_count || 0}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                course.status === 'active' ? 'bg-green-600 text-white' : 
                                course.status === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                              }`}>
                                {course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || 'Active'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Details */}
              {userDetails.type === 'admin' && (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                      🛡️ Admin Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Admin Level:</span>
                        <p className="text-white">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getAdminLevelColor(userDetails.admin_level)}`}>
                            {userDetails.admin_level?.charAt(0).toUpperCase() + userDetails.admin_level?.slice(1) || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Admin Since:</span>
                        <p className="text-white">{userDetails.admin_since ? new Date(userDetails.admin_since).toLocaleDateString() : selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {userDetails.permissions && userDetails.permissions.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                        🔐 Permissions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {userDetails.permissions.map((permission, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userDetails.recent_actions && userDetails.recent_actions.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                        📋 Recent Actions
                      </h4>
                      <div className="space-y-2">
                        {userDetails.recent_actions.slice(0, 5).map((action, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{action.description}</span>
                            <span className="text-gray-400">{new Date(action.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button 
              onClick={() => setShowUserDetailsModal(false)}
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

export default UserManagement;
