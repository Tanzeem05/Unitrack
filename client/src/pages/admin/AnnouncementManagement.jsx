import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

// Announcement Management Component
const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    target_audience: 'all'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api('/admin/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const newAnnouncement = await api('/admin/announcements', 'POST', formData);
      setAnnouncements([newAnnouncement, ...announcements]);
      setShowCreateModal(false);
      resetForm();
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
      const updatedAnnouncement = await api(`/admin/announcements/${selectedAnnouncement.announcement_id}`, 'PUT', formData);
      setAnnouncements(announcements.map(announcement => 
        announcement.announcement_id === selectedAnnouncement.announcement_id ? updatedAnnouncement : announcement
      ));
      setShowEditModal(false);
      resetForm();
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
      await api(`/admin/announcements/${selectedAnnouncement.announcement_id}`, 'DELETE');
      setAnnouncements(announcements.filter(announcement => announcement.announcement_id !== selectedAnnouncement.announcement_id));
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
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
      type: 'general',
      priority: 'medium',
      target_audience: 'all'
    });
    setFormErrors({});
    setSelectedAnnouncement(null);
  };

  const openEditModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'general',
      priority: announcement.priority || 'medium',
      target_audience: announcement.target_audience || 'all'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'medium': return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'low': return 'bg-green-500 bg-opacity-20 text-green-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'maintenance': return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'general': return 'bg-green-500 bg-opacity-20 text-green-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
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
          <h2 className="text-2xl font-bold text-white">Announcement Management</h2>
          <p className="text-gray-400">Manage global announcements for all users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📢</span>
          Create Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Search Announcements</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or content..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="maintenance">Maintenance</option>
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

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement, index) => (
            <div key={announcement.announcement_id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                      {announcement.type || 'General'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority || 'Medium'} Priority
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Target: {announcement.target_audience || 'All Users'}</span>
                    <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                      <span>Updated: {new Date(announcement.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
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
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">
              {searchTerm || typeFilter !== 'all' ? 'No announcements match your filters' : 'No announcements found'}
            </p>
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Announcement" size="lg">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Announcement title..."
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
              placeholder="Announcement content..."
              rows={4}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white resize-none ${
                formErrors.content ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.content && (
              <p className="text-red-400 text-xs mt-1">{formErrors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
              {submitting ? 'Creating...' : 'Create Announcement'}
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

      {/* Edit Announcement Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Announcement" size="lg">
        <form onSubmit={handleEditAnnouncement} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
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
              rows={4}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white resize-none ${
                formErrors.content ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.content && (
              <p className="text-red-400 text-xs mt-1">{formErrors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
              {submitting ? 'Updating...' : 'Update Announcement'}
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
              <p className="text-gray-400 text-sm">{selectedAnnouncement.type || 'General'} - {selectedAnnouncement.priority || 'Medium'} Priority</p>
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

export default AnnouncementManagement;
