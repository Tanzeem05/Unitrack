import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CurrentCourses from './student/CurrentCourses';
import CompletedCourses from './student/CompletedCourses';
import CourseDetails from './student/CourseDetails/CourseDetails';
import Messages from './student/Messages';
import { getUnreadMessageCount } from '../utils/api';

export default function StudentDashboard() {
  const [unreadCount, setUnreadCount] = useState(0);

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

  const navLinks = [
    { to: '/student', label: 'Current Courses' },
    { to: '/student/completed', label: 'Completed Courses' },
    { to: '/student/messages', label: 'Messages', badge: unreadCount },
    { to: '/student/announcements', label: 'Global Announcements' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white flex">
      <Sidebar links={navLinks} title="Student Panel" />
      <main className="flex-1">
        <Header title="Student Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CurrentCourses />} />
            <Route path="completed" element={<CompletedCourses />} />
            <Route path="messages" element={<Messages onUnreadCountChange={refreshUnreadCount} />} />
            <Route path="announcements" element={<h1 className="text-2xl font-semibold">Global Announcements</h1>} />
            <Route path="courses/:courseCode/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}