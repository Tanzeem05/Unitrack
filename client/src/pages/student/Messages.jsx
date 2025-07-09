import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

export default function Messages({ onUnreadCountChange }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [userTypeFilter, setUserTypeFilter] = useState('all');
    const [batchYearFilter, setBatchYearFilter] = useState('all');
    const [batchYears, setBatchYears] = useState([]);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
        fetchBatchYears();
        // Refresh unread count when Messages component mounts
        if (onUnreadCountChange) {
            setTimeout(() => {
                onUnreadCountChange();
            }, 100);
        }
    }, []);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation.username);
        }
    }, [currentConversation]);

    const fetchConversations = async () => {
        try {
            const response = await api('/messages/conversations');
            setConversations(response);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchBatchYears = async () => {
        try {
            const response = await api('/messages/batch-years');
            setBatchYears(response);
        } catch (error) {
            console.error('Error fetching batch years:', error);
        }
    };

    const fetchMessages = async (username) => {
        try {
            const response = await api(`/messages/${username}`);
            setMessages(response);
            // Mark messages as read
            await api(`/messages/${username}/mark-read`, 'PUT');
            // Refresh conversation list to update unread counts
            fetchConversations();
            // Refresh unread count in parent after marking as read with small delay
            if (onUnreadCountChange) {
                setTimeout(() => {
                    onUnreadCountChange();
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setUserSuggestions([]);
            return;
        }

        try {
            const params = new URLSearchParams({
                query,
                userType: userTypeFilter,
                batchYear: batchYearFilter,
            });

            const response = await api(`/messages/search-users?${params.toString()}`);
            setUserSuggestions(response);
        } catch (error) {
            console.error('Error searching users:', error);
        }
        if (!query.trim()) {
            setUserSuggestions([]);
            return;
        }
        // Filter user suggestions based on search query and filters
        const filteredSuggestions = userSuggestions.filter(user => {
            const matchesQuery = user.first_name.toLowerCase().includes(query.toLowerCase()) ||
                                 user.last_name.toLowerCase().includes(query.toLowerCase()) ||
                                 user.username.toLowerCase().includes(query.toLowerCase());
            const matchesType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
            const matchesYear = batchYearFilter === 'all' || (user.batch_year && user.batch_year === batchYearFilter);
            return matchesQuery && matchesType && matchesYear;
        });
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentConversation) return;

        try {
            await api('/messages/', 'POST', {
                recipientUsername: currentConversation.username,
                message: newMessage
            });
            setNewMessage('');
            fetchMessages(currentConversation.username);
            fetchConversations(); // Refresh conversation list
            if (onUnreadCountChange) {
                onUnreadCountChange(); // Refresh unread count in parent
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const selectConversation = (conversation) => {
        setCurrentConversation(conversation);
        // Refresh unread count immediately when selecting conversation
        if (onUnreadCountChange) {
            setTimeout(() => {
                onUnreadCountChange();
            }, 200);
        }
    };

    const startConversation = (selectedUser) => {
        setCurrentConversation(selectedUser);
        setShowUserSearch(false);
        setSearchQuery('');
        setUserSuggestions([]);
        // Refresh unread count immediately when starting conversation
        if (onUnreadCountChange) {
            setTimeout(() => {
                onUnreadCountChange();
            }, 200);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 2) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] bg-slate-800 rounded-lg shadow-lg flex">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Messages</h2>
                        <button
                            onClick={() => setShowUserSearch(!showUserSearch)}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            New Message
                        </button>
                    </div>

                    {/* User Search */}
                    {showUserSearch && (
                        <div className="mb-4 space-y-3">
                            <div className="flex space-x-2">
                                <select
                                    value={userTypeFilter}
                                    onChange={(e) => setUserTypeFilter(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm flex-1"
                                >
                                    <option value="all">All Users</option>
                                    <option value="teacher">Teachers</option>
                                    <option value="student">Students</option>
                                </select>
                                <select
                                    value={batchYearFilter}
                                    onChange={(e) => setBatchYearFilter(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm flex-1"
                                >
                                    <option value="all">All Years</option>
                                    {batchYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {userSuggestions.length > 0 && (
                                <div className="bg-slate-700 border border-slate-600 rounded-lg max-h-32 overflow-y-auto">
                                    {userSuggestions.map(user => (
                                        <div
                                            key={user.username}
                                            onClick={() => startConversation(user)}
                                            className="p-3 hover:bg-slate-600 cursor-pointer border-b border-slate-600 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                                                    <p className="text-sm text-slate-400">
                                                        {user.user_type === 'teacher' ? 'Teacher' : `Student - ${user.batch_year || 'Unknown'}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conversation => (
                        <div
                            key={conversation.username}
                            onClick={() => selectConversation(conversation)}
                            className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors ${currentConversation?.username === conversation.username ? 'bg-slate-700' : ''
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {conversation.first_name.charAt(0)}{conversation.last_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium truncate">{conversation.first_name} {conversation.last_name}</p>
                                        {conversation.unread_count > 0 && (
                                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 truncate">{conversation.last_message || 'No messages yet'}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {conversation.last_message_time ? formatTime(conversation.last_message_time) : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {currentConversation ? (
                    <>
                        {/* Message Header */}
                        <div className="p-4 border-b border-slate-700 bg-slate-750">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                    {currentConversation.first_name.charAt(0)}{currentConversation.last_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium">{currentConversation.first_name} {currentConversation.last_name}</p>
                                    <p className="text-sm text-slate-400">
                                        {currentConversation.user_type === 'teacher' ? 'Teacher' : `Student - ${currentConversation.batch_year || 'Unknown'}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(message => (
                                <div
                                    key={message.message_id}
                                    className={`flex ${message.sender_username === user.username ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_username === user.username
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-white'
                                            }`}
                                    >
                                        <p className="text-sm">{message.message}</p>
                                        <p className={`text-xs mt-1 ${message.sender_username === user.username ? 'text-blue-200' : 'text-slate-400'
                                            }`}>
                                            {formatTime(message.sent_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-slate-700">
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-lg">Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
