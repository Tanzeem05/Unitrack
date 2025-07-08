import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

export default function Discussions({ courseId }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyToPost, setReplyToPost] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, [courseId]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const data = await api(`/discussions/course/${courseId}`);
      setThreads(data);
    } catch (err) {
      console.error('Failed to fetch discussion threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadPosts = async (threadId) => {
    try {
      const data = await api(`/discussions/threads/${threadId}/posts`);
      setSelectedThread(data.thread);
      setPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch thread posts:', err);
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    try {
      setCreating(true);
      await api('/discussions/threads', 'POST', {
        course_id: courseId,
        title: newThreadTitle.trim(),
        created_by: user.user_id
      });

      setNewThreadTitle('');
      setShowCreateThread(false);
      await fetchThreads();
    } catch (err) {
      console.error('Failed to create thread:', err);
      alert('Failed to create thread. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedThread) return;

    try {
      setCreating(true);
      const newPost = await api(`/discussions/threads/${selectedThread.thread_id}/posts`, 'POST', {
        user_id: user.user_id,
        content: newPostContent.trim(),
        reply_to_post_id: replyToPost?.post_id || null
      });

      setPosts([...posts, newPost]);
      setNewPostContent('');
      setReplyToPost(null);
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const deleteThread = async (threadId) => {
    if (!confirm('Are you sure you want to delete this thread? This will also delete all posts in it.')) {
      return;
    }

    try {
      await api(`/discussions/threads/${threadId}`, 'DELETE', {
        user_id: user.user_id
      });
      
      await fetchThreads();
      if (selectedThread?.thread_id === threadId) {
        setSelectedThread(null);
        setPosts([]);
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
      alert('Failed to delete thread. Please try again.');
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
    return <div className="p-4">Loading discussions...</div>;
  }

  return (
    <div className="flex h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Left Panel - Thread List */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Discussion Threads</h2>
            <button
              onClick={() => setShowCreateThread(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition"
            >
              New Thread
            </button>
          </div>
          
          {/* Create Thread Form */}
          {showCreateThread && (
            <form onSubmit={createThread} className="mb-4">
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Thread title"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-3 py-1 rounded text-sm transition"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateThread(false);
                    setNewThreadTitle('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No discussion threads yet. Create the first one!
            </div>
          ) : (
            threads.map(thread => (
              <div
                key={thread.thread_id}
                onClick={() => fetchThreadPosts(thread.thread_id)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition ${
                  selectedThread?.thread_id === thread.thread_id ? 'bg-gray-800' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white truncate">{thread.title}</h3>
                  {user.user_id === thread.created_by && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.thread_id);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm ml-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  <div>By: {thread.creator_name}</div>
                  <div>Posts: {thread.post_count || 0}</div>
                  <div>Last activity: {formatDate(thread.last_activity || thread.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Posts */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">{selectedThread.title}</h3>
              <div className="text-sm text-gray-400">
                Created by {selectedThread.creator_name} on {formatDate(selectedThread.created_at)}
              </div>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {posts.map(post => (
                <div key={post.post_id} className={`p-4 rounded-lg ${
                  post.reply_to_post_id ? 'ml-8 bg-gray-800' : 'bg-gray-700'
                }`}>
                  {post.reply_to_post_id && (
                    <div className="text-sm text-blue-400 mb-2">
                      Replying to {post.reply_to_author}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-white">
                      {post.author_name}
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        post.user_type === 'teacher' ? 'bg-blue-600' : 'bg-green-600'
                      }`}>
                        {post.user_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap mb-3">{post.content}</p>
                  <button
                    onClick={() => setReplyToPost(post)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Reply
                  </button>
                </div>
              ))}
            </div>

            {/* New Post Form */}
            <div className="p-4 border-t border-gray-700">
              {replyToPost && (
                <div className="mb-3 p-2 bg-gray-800 rounded">
                  <div className="text-sm text-blue-400 mb-1">
                    Replying to {replyToPost.author_name}:
                  </div>
                  <div className="text-sm text-gray-300 truncate">
                    {replyToPost.content}
                  </div>
                  <button
                    onClick={() => setReplyToPost(null)}
                    className="text-red-400 hover:text-red-300 text-sm mt-1"
                  >
                    Cancel Reply
                  </button>
                </div>
              )}
              <form onSubmit={createPost}>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400 resize-vertical"
                  rows="3"
                  required
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded transition"
                >
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a thread to view the discussion
          </div>
        )}
      </div>
    </div>
  );
}
