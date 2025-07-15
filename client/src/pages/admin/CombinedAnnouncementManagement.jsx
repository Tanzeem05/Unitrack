import React from 'react';
import GlobalAnnouncementManagement from './GlobalAnnouncement';

const CombinedAnnouncementManagement = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🌐</span>
          Global Announcements
        </h2>
        <p className="text-gray-400 mt-1">
          Manage announcements visible to all students and teachers
        </p>
      </div>

      {/* Content */}
      <div>
        <GlobalAnnouncementManagement />
      </div>
    </div>
  );
};

export default CombinedAnnouncementManagement;
