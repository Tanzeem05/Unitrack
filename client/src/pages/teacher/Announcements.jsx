import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { ArrowLeft } from 'lucide-react';

export default function Announcements({ courseId }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const selectAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const goBackToList = () => {
    setSelectedAnnouncement(null);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [courseId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api(`/announcements/course/${courseId}`);
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setCreating(true);
      await api(`/announcements/${user.teacher_id}`, 'POST', {
        course_id: courseId,
        title: formData.title.trim(),
        content: formData.content.trim()
      });

      // Reset form and refresh announcements
      setFormData({ title: '', content: '' });
      setShowCreateForm(false);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement:', err);
      alert('Failed to create announcement. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '' });
    setShowCreateForm(false);
  };

  if (loading) {
    return <div className="p-4">Loading announcements...</div>;
  }

  // Show individual announcement detail view
  if (selectedAnnouncement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-white mb-4">{selectedAnnouncement.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>
                  Posted on {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {selectedAnnouncement.teacher_name && (
                  <span>By: {selectedAnnouncement.teacher_name}</span>
                )}
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Course Announcements</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition"
        >
          Create Announcement
        </button>
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Create New Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter announcement title"
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                placeholder="Enter announcement content"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded-lg text-white font-medium transition"
              >
                {creating ? 'Creating...' : 'Create Announcement'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No announcements yet. Create your first announcement!
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.announcement_id} className="bg-gray-800 rounded-lg border border-gray-700 transition-all duration-200">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => selectAnnouncement(announcement)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{announcement.title}</h3>
                    <span className="text-sm text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {announcement.teacher_name && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-400">
                          By: {announcement.teacher_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-400 text-sm">Click to view →</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
