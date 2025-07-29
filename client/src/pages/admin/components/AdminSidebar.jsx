import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { User, LogOut, ChevronUp, Shield, X } from 'lucide-react';

// Admin Sidebar Component
const AdminSidebar = ({ links, title, activeLink }) => {
  const { user, logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const handleLogout = () => {
    console.log('Admin logout initiated'); // Debug log
    setShowLogoutMenu(false);
    logout();
  };

  const handleUserProfileClick = () => {
    setShowLogoutMenu(false);
    setShowAdminInfo(true);
  };

  const handleLogoutIconClick = (e) => {
    e.stopPropagation();
    setShowAdminInfo(false);
    setShowLogoutMenu(!showLogoutMenu);
  };

  return (
    <aside className="w-72 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-2xl flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-purple-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">UniPortal</h1>
            <p className="text-purple-300 text-sm">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.path}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeLink === link.key
                  ? 'bg-purple-700 text-white shadow-lg transform scale-105'
                  : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-purple-700/50">
        <div className="relative">
          {/* Admin Information Modal */}
          {showAdminInfo && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50 max-w-sm">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">Admin Information</h3>
                  <button
                    onClick={() => setShowAdminInfo(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user?.username || 'Admin'}
                      </p>
                      <p className="text-gray-400 text-sm">Administrator</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Username:</span>
                      <p className="text-white">{user?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Admin Level:</span>
                      <p className="text-white">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user?.admin_level === 'super' ? 'bg-purple-600 text-white' :
                          user?.admin_level === 'admin' ? 'bg-blue-600 text-white' :
                          user?.admin_level === 'moderator' ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {user?.admin_level ? user.admin_level.charAt(0).toUpperCase() + user.admin_level.slice(1) : 'Admin'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">User Type:</span>
                      <p className="text-white capitalize">{user?.user_type || 'Admin'}</p>
                    </div>
                    {user?.created_at && (
                      <div>
                        <span className="text-gray-400">Member Since:</span>
                        <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Logout confirmation dropdown */}
          {showLogoutMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50">
              <div className="p-4">
                <p className="text-white text-sm mb-3">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    Yes, Logout
                  </button>
                  <button
                    onClick={() => setShowLogoutMenu(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div 
            className="flex items-center space-x-3 p-4 rounded-xl bg-purple-800/50 backdrop-blur-sm cursor-pointer hover:bg-purple-700/50 transition-colors"
            onClick={handleUserProfileClick}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.username || 'Admin'}
              </p>
              <p className="text-xs text-purple-300">Administrator</p>
            </div>
            <button 
              onClick={handleLogoutIconClick}
              className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-purple-700/50 rounded-lg"
              title="Logout"
            >
              {showLogoutMenu ? <ChevronUp className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
