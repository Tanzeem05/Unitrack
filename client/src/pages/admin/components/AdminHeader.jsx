import React from 'react';

// Admin Header Component
const AdminHeader = ({ title }) => {
  return (
    <header className="bg-purple-1800 bg-opacity-20 backdrop-blur-lg border-b border-purple-400 border-opacity-30 text-white px-6 py-4 shadow-lg">
      <h1 className="text-2xl font-bold">
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
    </header>
  );
};

export default AdminHeader;
