import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { Bell, Eye, Star, AlertTriangle, Info, Volume2 } from 'lucide-react';

const GlobalAnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, urgent

  // Get current user info from context/storage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          userId: user.user_id || user.admin_id,
          userRole: user.user_type || user.role || 'admin'
        };
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    // Fallback values for admin
    return {
      userId: localStorage.getItem('admin_id') || localStorage.getItem('user_id') || '1',
      userRole: 'admin'
    };
  };

  const { userId, userRole } = getUserInfo();

  // Debug logging
  useEffect(() => {
    console.log('Admin GlobalAnnouncements - User Info:', { userId, userRole });
  }, [userId, userRole]);

  const fetchGlobalAnnouncements = useCallback(async () => {
    const currentUserInfo = getUserInfo();
    if (!currentUserInfo.userId || !currentUserInfo.userRole) {
      console.log('No valid user info found', currentUserInfo);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        user_id: currentUserInfo.userId,
        user_role: currentUserInfo.userRole
      });

      if (filter === 'unread') {
        params.append('unread_only', 'true');
      } else if (filter === 'urgent') {
        params.append('priority', 'urgent');
      }

      console.log('Admin fetching announcements with params:', params.toString());
      const data = await api(`/global-announcements?${params.toString()}`);
      setAnnouncements(data.announcements || []);
      
      // Show setup message if database is not configured
      if (data.message && data.message.includes('Database not set up')) {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching global announcements:', err);
      setError('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchUnreadCount = useCallback(async () => {
    const currentUserInfo = getUserInfo();
    if (!currentUserInfo.userId || !currentUserInfo.userRole) {
      return;
    }

    try {
      const data = await api(`/global-announcements/unread-count?user_id=${currentUserInfo.userId}&user_role=${currentUserInfo.userRole}`);
      setUnreadCount(data.unread_count || 0);
      
      // Don't show error for setup message on unread count
      if (data.message && !data.message.includes('Database not set up')) {
        console.log('Info:', data.message);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      // Don't show error to user for unread count failures
    }
  }, []);

  useEffect(() => {
    fetchGlobalAnnouncements();
    fetchUnreadCount();
  }, [fetchGlobalAnnouncements, fetchUnreadCount]);

  const markAsRead = async (announcementId) => {
    const currentUserInfo = getUserInfo();
    if (!currentUserInfo.userId || !currentUserInfo.userRole) {
      console.log('No valid user info found for marking as read');
      return;
    }

    try {
      console.log('Admin marking as read for user:', { 
        userId: currentUserInfo.userId, 
        userRole: currentUserInfo.userRole, 
        announcementId 
      });
      
      await api(`/global-announcements/${announcementId}/read`, 'POST', {
        user_id: currentUserInfo.userId,
        user_role: currentUserInfo.userRole
      });

      // Update local state
      setAnnouncements(prev => 
        prev.map(ann => 
          ann.global_announcement_id === announcementId 
            ? { ...ann, is_read: true }
            : ann
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <Star className="w-5 h-5 text-orange-500" />;
      case 'normal':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'low':
        return <Volume2 className="w-5 h-5 text-gray-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Global Announcements</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Announcements
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'unread'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread Only {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'urgent'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Urgent Only
          </button>
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? 'You have no unread announcements.' :
             filter === 'urgent' ? 'There are no urgent announcements.' :
             'There are no global announcements at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.global_announcement_id}
              className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md ${
                announcement.is_read ? 'bg-white' : 'bg-purple-50 border-purple-200'
              } ${announcement.is_pinned ? 'ring-2 ring-yellow-200' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getPriorityIcon(announcement.priority)}
                  <h3 className={`text-lg font-semibold ${
                    announcement.is_read ? 'text-gray-900' : 'text-purple-900'
                  }`}>
                    {announcement.title}
                    {announcement.is_pinned && (
                      <span className="ml-2 text-yellow-600">📌</span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityBadgeColor(announcement.priority)}`}>
                    {announcement.priority.toUpperCase()}
                  </span>
                  {!announcement.is_read && (
                    <button
                      onClick={() => markAsRead(announcement.global_announcement_id)}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      <Eye className="w-3 h-3" />
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>By: {announcement.creator_name || 'System'}</span>
                  <span>Target: {announcement.target_audience}</span>
                  {announcement.expires_at && (
                    <span>Expires: {formatDate(announcement.expires_at)}</span>
                  )}
                </div>
                <span>{formatDate(announcement.created_at)}</span>
              </div>

              {announcement.is_read && announcement.read_at && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Read on {formatDate(announcement.read_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalAnnouncementsView;
