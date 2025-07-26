import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

const GlobalAnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAnnouncements: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    priority: '',
    target_audience: '',
    is_active: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    is_pinned: false,
    expires_at: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [pagination.currentPage, filters]);

  const fetchAnnouncements = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.target_audience) params.append('target_audience', filters.target_audience);
      if (filters.is_active !== '') params.append('is_active', filters.is_active);
      
      const data = await api(`/admin/global-announcements?${params.toString()}`);
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load global announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api('/admin/global-announcements/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      errors.expires_at = 'Expiration date must be in the future';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const newAnnouncement = await api('/admin/global-announcements', 'POST', {
        ...formData,
        expires_at: formData.expires_at || null
      });
      
      setShowCreateModal(false);
      resetForm();
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      await fetchAnnouncements(1);
      await fetchStats();
    } catch (err) {
      console.error('Error creating announcement:', err);
      setFormErrors({ submit: err.message || 'Failed to create announcement' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      await api(`/admin/global-announcements/${selectedAnnouncement.global_announcement_id}`, 'PUT', {
        ...formData,
        expires_at: formData.expires_at || null
      });
      
      setShowEditModal(false);
      resetForm();
      await fetchAnnouncements();
      await fetchStats();
    } catch (err) {
      console.error('Error updating announcement:', err);
      setFormErrors({ submit: err.message || 'Failed to update announcement' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    try {
      setSubmitting(true);
      await api(`/admin/global-announcements/${selectedAnnouncement.global_announcement_id}`, 'DELETE');
      
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
      await fetchAnnouncements();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_audience: 'all',
      is_pinned: false,
      expires_at: ''
    });
    setFormErrors({});
    setSelectedAnnouncement(null);
  };

  const openEditModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      is_active: announcement.is_active,
      is_pinned: announcement.is_pinned,
      expires_at: announcement.expires_at ? announcement.expires_at.slice(0, 16) : ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white border border-red-500';
      case 'high': return 'bg-orange-600 text-white border border-orange-500';
      case 'normal': return 'bg-blue-600 text-white border border-blue-500';
      case 'low': return 'bg-gray-600 text-white border border-gray-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  const getAudienceColor = (audience) => {
    switch (audience) {
      case 'all': return 'bg-purple-600 text-white border border-purple-500';
      case 'students': return 'bg-green-600 text-white border border-green-500';
      case 'teachers': return 'bg-blue-600 text-white border border-blue-500';
      case 'admins': return 'bg-red-600 text-white border border-red-500';
      default: return 'bg-gray-600 text-white border border-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-300">Loading announcements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Announcement Management</h2>
          <p className="text-gray-400">Create and manage announcements for all users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📢</span>
          Create Announcement
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Total Announcements</h3>
          <p className="text-2xl font-bold text-white">{stats.total_announcements || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Active</h3>
          <p className="text-2xl font-bold text-green-400">{stats.active_announcements || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Urgent</h3>
          <p className="text-2xl font-bold text-red-400">{stats.urgent_announcements || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm">Pinned</h3>
          <p className="text-2xl font-bold text-yellow-400">{stats.pinned_announcements || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Target Audience</label>
            <select
              value={filters.target_audience}
              onChange={(e) => handleFilterChange('target_audience', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">All Audiences</option>
              <option value="all">All Users</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="admins">Admins</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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

      {/* Announcements Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Title</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Priority</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Audience</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Created</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <tr key={announcement.global_announcement_id} className="border-b border-gray-700">
                    <td className="py-4 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {announcement.is_pinned && <span className="text-yellow-400">📌</span>}
                          <span className="text-white font-medium">{announcement.title}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 truncate max-w-xs">
                          {announcement.content}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAudienceColor(announcement.target_audience)}`}>
                        {announcement.target_audience.charAt(0).toUpperCase() + announcement.target_audience.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${announcement.status === 'active' ? 'bg-green-400' : announcement.status === 'expired' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                        <span className="text-gray-300 text-sm">{announcement.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300 text-sm">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(announcement)}
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
                    No announcements found
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
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalAnnouncements)} of {pagination.totalAnnouncements} announcements
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAnnouncements(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === 1 || 
                           page === pagination.totalPages || 
                           Math.abs(page - pagination.currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;
                    
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => fetchAnnouncements(page)}
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
                onClick={() => fetchAnnouncements(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        show={showCreateModal || showEditModal} 
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }} 
        title={showCreateModal ? "Create Global Announcement" : "Edit Global Announcement"} 
        size="lg"
      >
        <form onSubmit={showCreateModal ? handleCreateAnnouncement : handleEditAnnouncement} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter announcement title"
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                formErrors.title ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.title && (
              <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Enter announcement content"
              rows={5}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                formErrors.content ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.content && (
              <p className="text-red-400 text-xs mt-1">{formErrors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
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
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="is_pinned" className="text-gray-300 text-sm">Pin announcement</label>
            </div>

            {showEditModal && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-gray-300 text-sm">Active</label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Expiration Date (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${
                formErrors.expires_at ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.expires_at && (
              <p className="text-red-400 text-xs mt-1">{formErrors.expires_at}</p>
            )}
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Saving...' : showCreateModal ? 'Create Announcement' : 'Update Announcement'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Announcement" size="sm">
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              ⚠️ This action cannot be undone. The announcement will be permanently deleted.
            </p>
          </div>
          
          {selectedAnnouncement && (
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-white font-medium">{selectedAnnouncement.title}</p>
              <p className="text-gray-400 text-sm">{selectedAnnouncement.target_audience} • {selectedAnnouncement.priority}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleDeleteAnnouncement}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg"
            >
              {submitting ? 'Deleting...' : 'Delete Announcement'}
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

export default GlobalAnnouncementManagement;