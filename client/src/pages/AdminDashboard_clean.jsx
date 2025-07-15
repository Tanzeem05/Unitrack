import React, { useState } from 'react';
import AdminHeader from './admin/components/AdminHeader';
import AdminSidebar from './admin/components/AdminSidebar';
import DashboardOverview from './admin/DashboardOverview';
import CourseManagement from './admin/CourseManagement';
import UserManagementEnhanced from './admin/UserManagementEnhanced';
import GlobalAnnouncementManagement from './admin/GlobalAnnouncement';

// Main AdminDashboard Component
const AdminDashboard = () => {
  const [activeLink, setActiveLink] = useState('dashboard');

  const sidebarLinks = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'courses', label: 'Courses', icon: '📚' },
    { key: 'announcements', label: 'Announcements', icon: '📢' },
    { key: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeLink) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UserManagementEnhanced />;
      case 'courses':
        return <CourseManagement />;
      case 'announcements':
        return <GlobalAnnouncementManagement />;
      case 'settings':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
            <p className="text-gray-400">Settings management will be implemented here.</p>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <AdminHeader title="Admin Dashboard" />
      <div className="flex flex-1">
        <AdminSidebar 
          links={sidebarLinks} 
          title="Navigation" 
          activeLink={activeLink} 
          onLinkClick={setActiveLink} 
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
