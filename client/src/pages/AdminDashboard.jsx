import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminHeader from './admin/components/AdminHeader';
import AdminSidebar from './admin/components/AdminSidebar';
import DashboardOverview from './admin/DashboardOverview';
import CourseManagement from './admin/CourseManagement';
import UserManagementEnhanced from './admin/UserManagementEnhanced';
import CombinedAnnouncementManagement from './admin/CombinedAnnouncementManagement';
import CourseDetails from './admin/CourseDetails';

// Main AdminDashboard Component
const AdminDashboard = () => {
  const location = useLocation();
  
  // Extract current page from URL path
  const getCurrentActiveLink = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/courses')) return 'courses';
    if (path.includes('/admin/announcements')) return 'announcements';
    return 'dashboard';
  };

  const activeLink = getCurrentActiveLink();

  const sidebarLinks = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/admin' },
    { key: 'users', label: 'Users', icon: '👥', path: '/admin/users' },
    { key: 'courses', label: 'Courses', icon: '📚', path: '/admin/courses' },
    { key: 'announcements', label: 'Announcements', icon: '📢', path: '/admin/announcements' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <AdminHeader title="Admin Dashboard" />
      <div className="flex flex-1">
        <AdminSidebar 
          links={sidebarLinks} 
          title="Navigation" 
          activeLink={activeLink} 
        />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UserManagementEnhanced />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/:courseId" element={<CourseDetails />} />
            <Route path="announcements" element={<CombinedAnnouncementManagement />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
