import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { Bell, ArrowLeft } from 'lucide-react';

const Announcements = ({ courseCode }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);
      
      const username = localStorage.getItem('username');
      
      if (!courseCode || !username) {
        setError('Missing course code or username');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching announcements for course: ${courseCode}, username: ${username}`);
        
        // Use the simplified endpoint with course_code and username
        const data = await api(`/announcements/course-code/${courseCode}/username/${username}`, 'GET');
        console.log('Fetched announcements data:', data);
        
        if (data.error) {
          setError(data.error);
          setAnnouncements([]);
        } else {
          setAnnouncements(data || []);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setError('Failed to load announcements');
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [courseCode]);

  const selectAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const goBackToList = () => {
    setSelectedAnnouncement(null);
  };

  if (loading) {
    return <div className="text-center py-8">
      <div className="text-white">Loading announcements...</div>
    </div>;
  }

  if (error) {
    return <div className="text-center py-8">
      <div className="text-red-400">Error: {error}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>;
  }

  // Show individual announcement detail view
  if (selectedAnnouncement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </button>
        </div>
        
        <div className="bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-3xl font-bold text-white">{selectedAnnouncement.title}</h1>
                {!selectedAnnouncement.is_read && (
                  <span className="inline-block px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-full">New</span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Posted on {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-200 leading-relaxed text-lg whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white">Course Announcements</h3>
        <p className="text-gray-300 mt-1">Stay updated with important notifications for this course.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No announcements</h3>
          <p className="mt-1 text-sm text-gray-500">There are no announcements for this course at this time.</p>
          <div className="mt-4 text-xs text-gray-600">
            Debug info: Course: {courseCode} | Username: {localStorage.getItem('username')}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement.announcement_id} 
              className={`bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 overflow-hidden cursor-pointer hover:bg-purple-800 hover:bg-opacity-20 transition-all duration-200 ${announcement.is_read ? '' : 'border-green-400'}`}
              onClick={() => selectAnnouncement(announcement)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-xl font-bold text-white hover:text-purple-300 transition-colors">
                        {announcement.title}
                      </h4>
                      {!announcement.is_read && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">New</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-300 mt-2 line-clamp-2">
                      {announcement.content.length > 100 
                        ? announcement.content.substring(0, 100) + '...' 
                        : announcement.content
                      }
                    </p>
                  </div>
                  <div className="ml-4 text-purple-400">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;