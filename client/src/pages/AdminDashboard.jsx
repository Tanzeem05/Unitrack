import { Routes, Route } from 'react-router-dom';
import GlobalAnnouncements from './admin/GlobalAnnouncement';
import UserManagement from './admin/UserManagement';
import CourseManagement from './admin/CourseManagement';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const navLinks = [
    { to: 'announcements', label: 'Global Announcements' },
    { to: 'users', label: 'User Management' },
    { to: 'courses', label: 'Course Management' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar links={navLinks} title="Admin Panel" />
      <main className="flex-1">
        <Header title="Admin Dashboard" />
        <div className="p-6">
          <Routes>
            <Route path="announcements" element={<GlobalAnnouncements />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="courses" element={<CourseManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}