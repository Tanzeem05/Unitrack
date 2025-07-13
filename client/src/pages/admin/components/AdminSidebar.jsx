import React from 'react';

// Admin Sidebar Component
const AdminSidebar = ({ links, title, activeLink, onLinkClick }) => {
  return (
    <div className="w-80 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <nav className="mt-6">
        {links.map((link) => (
          <div
            key={link.key}
            onClick={() => onLinkClick(link.key)}
            className={`flex items-center gap-3 px-6 py-4 text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200 border-l-4 cursor-pointer ${
              activeLink === link.key
                ? 'border-blue-500 bg-gray-700 text-white' 
                : 'border-transparent'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="font-medium">{link.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
