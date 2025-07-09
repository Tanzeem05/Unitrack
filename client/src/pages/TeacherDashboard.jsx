import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TeacherSidebar from './teacher/TeacherSidebar';
import CoursesPage from './teacher/CoursePage';
import CourseDetails from './teacher/CourseDetails';
import Messages from './teacher/Messages';
import GlobalAnnouncement from './admin/GlobalAnnouncement'; // Assuming this is the correct path for Global Announcements
import { getUnreadMessageCount } from '../utils/api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadMessageCount();
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for updates every 10 seconds for more responsive UI
    const interval = setInterval(fetchUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshUnreadCount = async () => {
    try {
      const response = await getUnreadMessageCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'courses') {
      navigate('/teacher');
    } else if (tab === 'announcements') {
      navigate('/teacher/announcements');
    } else if (tab === 'messages') {
      navigate('/teacher/messages');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white flex">
      <TeacherSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        unreadCount={unreadCount}
      />
      <main className="flex-1 ml-72">
        <Header title="Teacher Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CoursesPage />} />
            <Route path="announcements" element={<GlobalAnnouncement />} />
            <Route path="messages" element={<Messages onUnreadCountChange={refreshUnreadCount} />} />
            <Route path="courses/:courseId/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}