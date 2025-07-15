import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { Bell, Eye, Star, AlertTriangle, Info, Volume2, ArrowLeft } from 'lucide-react';

const GlobalAnnouncementsView = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // all, unread, urgent
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const selectAnnouncement = (announcement) => {
        setSelectedAnnouncement(announcement);
    };

    const goBackToList = () => {
        setSelectedAnnouncement(null);
    };

    // Get current user info from context/storage
    const getUserInfo = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return {
                    userId: user.user_id || user.student_id || user.teacher_id || user.admin_id,
                    userRole: user.user_type || user.role || 'student'
                };
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
        // Fallback values
        return {
            userId: localStorage.getItem('student_id') || localStorage.getItem('teacher_id') || localStorage.getItem('admin_id') || '1',
            userRole: 'student'
        };
    };

    const { userId, userRole } = getUserInfo();

    // Debug logging
    useEffect(() => {
        console.log('GlobalAnnouncements - User Info:', { userId, userRole });
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

            console.log('Fetching announcements with params:', params.toString());
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
            console.log('Marking as read for user:', {
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

            // Update selected announcement if it's the one being marked as read
            if (selectedAnnouncement && selectedAnnouncement.global_announcement_id === announcementId) {
                setSelectedAnnouncement(prev => ({ ...prev, is_read: true }));
            }

            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking announcement as read:', err);
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <AlertTriangle className="h-5 w-5 text-red-400" />;
            case 'high':
                return <Volume2 className="h-5 w-5 text-orange-400" />;
            case 'normal':
                return <Info className="h-5 w-5 text-blue-400" />;
            case 'low':
                return <Bell className="h-5 w-5 text-gray-400" />;
            default:
                return <Bell className="h-5 w-5 text-gray-400" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-500 bg-red-900/20';
            case 'high':
                return 'border-orange-500 bg-orange-900/20';
            case 'normal':
                return 'border-blue-500 bg-blue-900/20';
            case 'low':
                return 'border-gray-500 bg-gray-900/20';
            default:
                return 'border-gray-500 bg-gray-900/20';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-300">Loading announcements...</span>
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

    // Show individual announcement detail view
    if (selectedAnnouncement) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBackToList}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Announcements
                    </button>
                </div>
                
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="p-8">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                {selectedAnnouncement.is_pinned && (
                                    <Star className="h-6 w-6 text-yellow-400 fill-current" />
                                )}
                                <h1 className="text-3xl font-semibold text-white">{selectedAnnouncement.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedAnnouncement.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                    selectedAnnouncement.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                    selectedAnnouncement.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                }`}>
                                    {selectedAnnouncement.priority.charAt(0).toUpperCase() + selectedAnnouncement.priority.slice(1)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>
                                    Posted on {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {selectedAnnouncement.expires_at && new Date(selectedAnnouncement.expires_at) > new Date() && (
                                    <span className="text-yellow-400">
                                        Expires {new Date(selectedAnnouncement.expires_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                )}
                                {!selectedAnnouncement.is_read && (
                                    <button
                                        onClick={() => markAsRead(selectedAnnouncement.global_announcement_id)}
                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="prose prose-invert max-w-none">
                            <div className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                                {selectedAnnouncement.content}
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-600">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>By: {selectedAnnouncement.creator_name || 'System'}</span>
                                {selectedAnnouncement.is_read && selectedAnnouncement.read_at && (
                                    <span className="text-green-400">
                                        ✓ Read on {new Date(selectedAnnouncement.read_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="h-7 w-7" />
                        Global Announcements
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-400">Important messages from administration</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-gray-800 rounded-lg p-1 border border-gray-700 inline-flex">
                {[
                    { key: 'all', label: 'All', count: announcements.length },
                    { key: 'unread', label: 'Unread', count: unreadCount },
                    { key: 'urgent', label: 'Urgent', count: announcements.filter(a => a.priority === 'urgent').length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 bg-gray-600 text-xs px-2 py-1 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className={`rounded-lg p-4 ${error.includes('Database not set up')
                        ? 'bg-blue-900/20 border border-blue-500'
                        : 'bg-red-900/20 border border-red-500'
                    }`}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">
                            {error.includes('Database not set up') ? '🔧' : '❌'}
                        </span>
                        <div>
                            <p className={`${error.includes('Database not set up')
                                    ? 'text-blue-400'
                                    : 'text-red-400'
                                } font-medium`}>
                                {error.includes('Database not set up')
                                    ? 'Setup Required'
                                    : 'Error'}
                            </p>
                            <p className="text-gray-300 mt-1">{error}</p>
                            {error.includes('Database not set up') && (
                                <div className="mt-3 text-sm text-gray-400">
                                    <p>To set up global announcements:</p>
                                    <ol className="list-decimal list-inside mt-2 space-y-1">
                                        <li>Navigate to the server directory</li>
                                        <li>Run: <code className="bg-gray-700 px-2 py-1 rounded">node setup_global_announcements.js</code></li>
                                        <li>Refresh this page</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                        <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No announcements</h3>
                        <p className="text-gray-400">
                            {filter === 'unread'
                                ? "You're all caught up! No unread announcements."
                                : filter === 'urgent'
                                    ? "No urgent announcements at this time."
                                    : "No announcements available."}
                        </p>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <div
                            key={announcement.global_announcement_id}
                            className={`rounded-lg border-l-4 p-6 transition-all duration-200 hover:shadow-lg cursor-pointer ${getPriorityColor(announcement.priority)
                                } ${!announcement.is_read ? 'ring-2 ring-blue-500/20' : ''
                                }`}
                            onClick={() => selectAnnouncement(announcement)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        {getPriorityIcon(announcement.priority)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {announcement.is_pinned && (
                                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                )}
                                                <h3 className="text-lg font-semibold text-white">
                                                    {announcement.title}
                                                </h3>
                                                {!announcement.is_read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${announcement.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                                    announcement.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                        announcement.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                                </span>
                                                <span>By: {announcement.creator_name || 'System'}</span>
                                                <span>{formatDate(announcement.created_at)}</span>
                                                {announcement.expires_at && new Date(announcement.expires_at) > new Date() && (
                                                    <span className="text-yellow-400">
                                                        Expires {formatDate(announcement.expires_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <span className="text-blue-400 text-sm">Click to view →</span>
                                        </div>
                                    </div>

                                    {/* Preview of content */}
                                    <div className="text-gray-300 text-sm mb-3">
                                        {announcement.content.length > 100 
                                            ? `${announcement.content.substring(0, 100)}...`
                                            : announcement.content
                                        }
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-400">
                                            {announcement.is_read && announcement.read_at && (
                                                <span className="text-green-400">
                                                    ✓ Read on {formatDate(announcement.read_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Info */}
            {announcements.length > 0 && (
                <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-700">
                    Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
                    {filter !== 'all' && ` (filtered by ${filter})`}
                </div>
            )}
        </div>
    );
};

export default GlobalAnnouncementsView;
