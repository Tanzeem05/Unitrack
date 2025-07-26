import React from 'react';

// Admin Header Component
const AdminHeader = ({ title }) => {
  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">Welcome back, Admin</span>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
