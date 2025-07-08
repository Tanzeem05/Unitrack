import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Bell } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!username) return;
      try {
        const data = await api(`/announcements/student/${username}`, 'GET');
        if (data.error) {
          setAnnouncements([]);
        } else {
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [username]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white">Latest Announcements</h3>
        <p className="text-gray-300 mt-1">Stay updated with important notifications</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No announcements</h3>
          <p className="mt-1 text-sm text-gray-500">There are no new announcements at this time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div key={announcement.announcement_id} className="bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-xl font-bold text-white">{announcement.title}</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      From {announcement.teacher_name} in {announcement.course_name} • {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-200 leading-relaxed text-lg">{announcement.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;