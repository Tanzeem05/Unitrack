import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import Modal from './components/Modal';

// Course Management Component
const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCourses: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Test the connection first
    testConnection();
    fetchCourses(1); // Always start with page 1 on initial load
    fetchTeachers();
  }, []);

  const testConnection = async () => {
    try {
      const testResult = await api('/admin/test');
      console.log('Connection test:', testResult);
      
      // Test the specific admin courses endpoint
      try {
        const adminCourses = await api('/admin/courses?page=1&limit=5');
        console.log('Admin courses endpoint result:', adminCourses);
        console.log('Admin courses type:', typeof adminCourses);
        console.log('Admin courses is array:', Array.isArray(adminCourses));
      } catch (adminErr) {
        console.error('Admin courses test failed:', adminErr);
      }
      
      // Test the regular courses endpoint for comparison
      try {
        const regularCourses = await api('/courses');
        console.log('Regular courses endpoint result:', regularCourses);
        console.log('Regular courses type:', typeof regularCourses);
        console.log('Regular courses is array:', Array.isArray(regularCourses));
      } catch (regularErr) {
        console.error('Regular courses test failed:', regularErr);
      }
      
    } catch (err) {
      console.error('Connection test failed:', err);
    }
  };

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true);
      const data = await api(`/admin/courses?page=${page}&limit=10`);
      
      console.log('API Response:', data);
      console.log('Type of data:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Handle both old and new response formats
      if (Array.isArray(data)) {
        // Old format - direct array response
        console.log('Using old format (direct array)');
        setCourses(data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCourses: data.length,
          limit: 10,
          hasNext: false,
          hasPrev: false
        });
      } else if (data && data.courses) {
        // New format - object with courses and pagination
        console.log('Using new format (paginated object)');
        console.log('Courses received:', data.courses);
        console.log('Pagination received:', data.pagination);
        setCourses(data.courses || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCourses: 0,
          limit: 10,
          hasNext: false,
          hasPrev: false
        });
      } else {
        console.log('Unexpected data format:', data);
        setCourses([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCourses: 0,
          limit: 10,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
      setCourses([]); // Ensure courses is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await api('/admin/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const validateForm = (isEdit = false) => {
    const errors = {};
    const currentDate = new Date();
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    if (!formData.course_code.trim()) {
      errors.course_code = 'Course code is required';
    }
    if (!formData.course_name.trim()) {
      errors.course_name = 'Course name is required';
    }
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    // Validate start date is not in the past (only for new courses, not edits)
    if (formData.start_date && !isEdit) {
      const startDate = new Date(formData.start_date);
      if (startDate < today) {
        errors.start_date = 'Start date cannot be in the past';
      }
    }
    
    // Validate end date is after start date
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (startDate >= endDate) {
        errors.end_date = 'End date must be after start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    if (!validateForm(false)) return;
    
    try {
      setSubmitting(true);
      const newCourse = await api('/admin/courses', 'POST', formData);
      
      // Reset to first page and refresh the courses list
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      await fetchCourses(1);
      
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating course:', err);
      setFormErrors({ submit: err.message || 'Failed to create course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    
    if (!validateForm(true)) return;
    
    try {
      setSubmitting(true);
      const updatedCourse = await api(`/admin/courses/${selectedCourse.course_id}`, 'PUT', formData);
      
      // Refresh the current page to show updated data
      await fetchCourses(pagination.currentPage || 1);
      
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error('Error updating course:', err);
      setFormErrors({ submit: err.message || 'Failed to update course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setSubmitting(true);
      await api(`/admin/courses/${selectedCourse.course_id}`, 'DELETE');
      
      // If current page becomes empty after deletion, go to previous page
      const remainingCourses = (courses || []).length - 1;
      const currentPage = pagination.currentPage || 1;
      
      if (remainingCourses === 0 && currentPage > 1) {
        await fetchCourses(currentPage - 1);
      } else {
        await fetchCourses(currentPage);
      }
      
      setShowDeleteModal(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      description: '',
      start_date: '',
      end_date: ''
    });
    setFormErrors({});
    setSelectedCourse(null);
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      start_date: course.start_date ? new Date(course.start_date).toISOString().split('T')[0] : '',
      end_date: course.end_date ? new Date(course.end_date).toISOString().split('T')[0] : ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (course) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  };

  const showDetails = (course) => {
    navigate(`/admin/courses/${course.course_id}`);
  };

  const filteredCourses = (courses || []).filter(course => {
    // Defensive programming: handle undefined properties
    const courseName = course.course_name || '';
    const courseCode = course.course_code || '';
    const courseStatus = course.status || 'unknown';
    
    const matchesSearch = courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || courseStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-600 text-white border border-gray-500';
    
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-600 text-white border border-green-500';
      case 'upcoming': return 'bg-blue-600 text-white border border-blue-500';
      case 'completed': return 'bg-gray-600 text-white border border-gray-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading courses...</span>
      </div>
    );
  }

  // Show course details if a course is selected
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Course Management</h2>
          <p className="text-gray-400">
            Manage all courses in the system 
            {pagination.totalCourses > 0 && (
              <span className="text-blue-400 ml-1">({pagination.totalCourses} total courses)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📚</span>
          Create Course
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Search Courses</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course name or code..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Courses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Courses Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Course Code</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Course Name</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Enrollments</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Duration</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <tr key={course.course_id} className="border-b border-gray-700">
                    <td className="py-4 px-4">
                      <span className="font-mono text-blue-400">{course.course_code || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{course.course_name || 'Unnamed Course'}</p>
                        {course.description && (
                          <p className="text-gray-400 text-sm mt-1 truncate max-w-xs">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                        {course.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{course.enrollment_count || 0} students</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-gray-300">
                          {course.start_date ? new Date(course.start_date).toLocaleDateString() : 'Not set'}
                        </p>
                        <p className="text-gray-400">
                          to {course.end_date ? new Date(course.end_date).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => showDetails(course)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(course)}
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
                    {searchTerm || statusFilter !== 'all' ? 'No courses match your filters' : 'No courses found'}
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
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCourses)} of {pagination.totalCourses} courses
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCourses(pagination.currentPage - 1)}
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
                          onClick={() => fetchCourses(page)}
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
                onClick={() => fetchCourses(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Course" size="lg">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Course Code *</label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({...formData, course_code: e.target.value.toUpperCase()})}
                placeholder="e.g., CS101"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.course_code ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.course_code && (
                <p className="text-red-400 text-xs mt-1">{formErrors.course_code}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Course Name *</label>
              <input
                type="text"
                value={formData.course_name}
                onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                placeholder="e.g., Introduction to Computer Science"
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.course_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.course_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.course_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Course description..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.start_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.start_date && (
                <p className="text-red-400 text-xs mt-1">{formErrors.start_date}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">End Date *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.end_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.end_date && (
                <p className="text-red-400 text-xs mt-1">{formErrors.end_date}</p>
              )}
            </div>
          </div>

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
              {submitting ? 'Creating...' : 'Create Course'}
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

      {/* Edit Course Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Course" size="lg">
        <form onSubmit={handleEditCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Course Code *</label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({...formData, course_code: e.target.value.toUpperCase()})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.course_code ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.course_code && (
                <p className="text-red-400 text-xs mt-1">{formErrors.course_code}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Course Name *</label>
              <input
                type="text"
                value={formData.course_name}
                onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.course_name ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.course_name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.course_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.start_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.start_date && (
                <p className="text-red-400 text-xs mt-1">{formErrors.start_date}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">End Date *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                min={formData.start_date}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                  formErrors.end_date ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.end_date && (
                <p className="text-red-400 text-xs mt-1">{formErrors.end_date}</p>
              )}
            </div>
          </div>

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
              {submitting ? 'Updating...' : 'Update Course'}
            </button>
            <button 
              type="button"
              onClick={() => setShowEditModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Course" size="sm">
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              ⚠️ This action cannot be undone. All course data, enrollments, and associated content will be permanently deleted.
            </p>
          </div>
          
          {selectedCourse && (
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-white font-medium">{selectedCourse.course_name}</p>
              <p className="text-gray-400 text-sm">{selectedCourse.course_code}</p>
              <p className="text-gray-400 text-sm">{selectedCourse.enrollment_count || 0} enrolled students</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleDeleteCourse}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Deleting...' : 'Delete Course'}
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
    </div>
  );
};

export default CourseManagement;
