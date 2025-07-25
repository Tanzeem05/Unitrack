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
    </div>;
  }

  // Show individual announcement detail view
  if (selectedAnnouncement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goBackToList}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Announcements
          </button>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <Bell className="w-6 h-6 text-blue-400 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {selectedAnnouncement.title}
              </h2>
              <div className="text-sm text-gray-400 mb-4">
                Posted on {new Date(selectedAnnouncement.created_at).toLocaleDateString()} at{' '}
                {new Date(selectedAnnouncement.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show announcements list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Course Announcements</h2>
        <div className="text-sm text-gray-400">
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No Announcements</h3>
          <p className="text-gray-500">There are no announcements for this course yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.announcement_id}
              onClick={() => selectAnnouncement(announcement)}
              className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500"
            >
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Posted {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-blue-400">Click to read more →</span>
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
