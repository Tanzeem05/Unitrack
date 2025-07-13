import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

// Course Management Component
const CourseManagement = () => {
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
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await api('/admin/courses');
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
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

  const validateForm = () => {
    const errors = {};
    
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
    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const newCourse = await api('/admin/courses', 'POST', formData);
      setCourses([newCourse, ...courses]);
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
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const updatedCourse = await api(`/admin/courses/${selectedCourse.course_id}`, 'PUT', formData);
      setCourses(courses.map(course => 
        course.course_id === selectedCourse.course_id ? updatedCourse : course
      ));
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
      setCourses(courses.filter(course => course.course_id !== selectedCourse.course_id));
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'upcoming': return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'completed': return 'bg-gray-500 bg-opacity-20 text-gray-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Course Management</h2>
          <p className="text-gray-400">Manage all courses in the system</p>
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
                      <span className="font-mono text-blue-400">{course.course_code}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{course.course_name}</p>
                        {course.description && (
                          <p className="text-gray-400 text-sm mt-1 truncate max-w-xs">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{course.enrollment_count || 0} students</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-gray-300">
                          {new Date(course.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-400">
                          to {new Date(course.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
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
