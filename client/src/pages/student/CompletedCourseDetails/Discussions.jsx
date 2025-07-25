// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { MessageCircle, ArrowLeft, User, Clock } from 'lucide-react';

// const Discussions = ({ courseCode }) => {
//   const [discussions, setDiscussions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedDiscussion, setSelectedDiscussion] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [postsLoading, setPostsLoading] = useState(false);

//   useEffect(() => {
//     const fetchDiscussions = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         console.log(`Fetching discussions for course: ${courseCode}`);
//         const data = await api(`/discussions/course_code/${courseCode}`, 'GET');
//         console.log('Fetched discussions data:', data);
        
//         if (data.error) {
//           setError(data.error);
//           setDiscussions([]);
//         } else {
//           setDiscussions(data || []);
//         }
//       } catch (error) {
//         console.error('Error fetching discussions:', error);
//         setError('Failed to load discussions');
//         setDiscussions([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseCode) {
//       fetchDiscussions();
//     }
//   }, [courseCode]);

//   const selectDiscussion = async (discussion) => {
//     setSelectedDiscussion(discussion);
//     setPostsLoading(true);
    
//     try {
//       const postsData = await api(`/discussions/posts/${discussion.thread_id}`, 'GET');
//       setPosts(postsData || []);
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       setPosts([]);
//     } finally {
//       setPostsLoading(false);
//     }
//   };

//   const goBackToList = () => {
//     setSelectedDiscussion(null);
//     setPosts([]);
//   };

//   if (loading) {
//     return <div className="text-center py-8">
//       <div className="text-white">Loading discussions...</div>
//     </div>;
//   }

//   if (error) {
//     return <div className="text-center py-8">
//       <div className="text-red-400">Error: {error}</div>
//     </div>;
//   }

//   // Show individual discussion detail view
//   if (selectedDiscussion) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={goBackToList}
//             className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to Discussions
//           </button>
//         </div>

//         <div className="bg-gray-700 rounded-lg p-6">
//           <div className="flex items-start gap-4 mb-4">
//             <MessageCircle className="w-6 h-6 text-blue-400 mt-1" />
//             <div className="flex-1">
//               <h2 className="text-xl font-bold text-white mb-2">
//                 {selectedDiscussion.title}
//               </h2>
//               <div className="text-sm text-gray-400 mb-4">
//                 Started on {new Date(selectedDiscussion.created_at).toLocaleDateString()}
//               </div>
//               <p className="text-gray-300">
//                 {selectedDiscussion.description}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Posts */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold text-white">Discussion Posts</h3>
          
//           {postsLoading ? (
//             <div className="text-center py-4 text-gray-400">Loading posts...</div>
//           ) : posts.length === 0 ? (
//             <div className="text-center py-8 text-gray-400">
//               No posts in this discussion yet.
//             </div>
//           ) : (
//             posts.map((post) => (
//               <div key={post.post_id} className="bg-gray-700 rounded-lg p-4">
//                 <div className="flex items-start gap-3">
//                   <User className="w-8 h-8 text-gray-400 bg-gray-600 rounded-full p-1" />
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-2">
//                       <span className="font-medium text-white">{post.username}</span>
//                       <span className="text-xs text-gray-400">•</span>
//                       <span className="text-xs text-gray-400">
//                         {new Date(post.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                     <p className="text-gray-300">{post.content}</p>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Show discussions list
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-semibold text-white">Course Discussions</h2>
//         <div className="text-sm text-gray-400">
//           {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
//         </div>
//       </div>

//       {discussions.length === 0 ? (
//         <div className="text-center py-12">
//           <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-400 mb-2">No Discussions</h3>
//           <p className="text-gray-500">There are no discussions for this course yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {discussions.map((discussion) => (
//             <div
//               key={discussion.thread_id}
//               onClick={() => selectDiscussion(discussion)}
//               className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500"
//             >
//               <div className="flex items-start gap-3">
//                 <MessageCircle className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-semibold text-white mb-1">
//                     {discussion.title}
//                   </h3>
//                   <p className="text-gray-300 text-sm line-clamp-2 mb-2">
//                     {discussion.description}
//                   </p>
//                   <div className="flex items-center justify-between text-xs text-gray-400">
//                     <span>
//                       Started {new Date(discussion.created_at).toLocaleDateString()}
//                     </span>
//                     <span className="text-blue-400">View discussion →</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Discussions;


import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';

export default function Discussions({ courseCode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyToPost, setReplyToPost] = useState(null);
  const [creating, setCreating] = useState(false);
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const fetchCourseAndThreads = async () => {
      try {
        setLoading(true);
        // First get the course ID from course code
        const courseData = await api(`/courses/course_code/${encodeURIComponent(courseCode)}`);
        setCourseId(courseData.course_id);
        
        // Then fetch threads
        const threadsData = await api(`/discussions/course/${courseData.course_id}`);
        setThreads(threadsData);
      } catch (err) {
        console.error('Failed to fetch discussion threads:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseCode) {
      fetchCourseAndThreads();
    }
  }, [courseCode]);

  const fetchThreadPosts = async (threadId) => {
    try {
      const data = await api(`/discussions/threads/${threadId}/posts`);
      setSelectedThread(data.thread);
      setPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch thread posts:', err);
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
    <div className="flex h-[600px] bg-gray-800 rounded-lg overflow-hidden">
      {/* Left Panel - Thread List */}
      <div className="w-1/3 border-r border-gray-600 flex flex-col">
        <div className="p-4 border-b border-gray-600">
          <h2 className="text-xl font-semibold">Discussion Threads</h2>
          <p className="text-sm text-gray-400 mt-1">
            Students can participate in discussions created by teachers
          </p>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No discussion threads available yet.
            </div>
          ) : (
            threads.map(thread => (
              <div
                key={thread.thread_id}
                onClick={() => fetchThreadPosts(thread.thread_id)}
                className={`p-4 border-b border-gray-600 cursor-pointer hover:bg-gray-700 transition ${
                  selectedThread?.thread_id === thread.thread_id ? 'bg-gray-700' : ''
                }`}
              >
                <h3 className="font-semibold text-white truncate mb-2">{thread.title}</h3>
                <div className="text-sm text-gray-400">
                  <div>Created by: {thread.creator_name}</div>
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
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold">{selectedThread.title}</h3>
              <div className="text-sm text-gray-400">
                Created by {selectedThread.creator_name} on {formatDate(selectedThread.created_at)}
              </div>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {posts.map(post => (
                <div key={post.post_id} className={`p-4 rounded-lg ${
                  post.reply_to_post_id ? 'ml-8 bg-gray-700' : 'bg-gray-600'
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
                        post.user_type === 'teacher' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {post.user_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap mb-3">{post.content}</p>
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
            <div className="p-4 border-t border-gray-600">
              {replyToPost && (
                <div className="mb-3 p-2 bg-gray-700 rounded">
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

