import { useState, useEffect } from 'react';

export default function TeacherResources({ courseId }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '' });
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingToThread, setUploadingToThread] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, [courseId]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resources/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      } else {
        setError('Failed to fetch resources');
      }
    } catch (err) {
      console.error('Failed to fetch resource threads:', err);
      setError('Failed to load resource threads');
    } finally {
      setLoading(false);
    }
  };

  const createThread = async (e) => {
    e.preventDefault();
    if (!newThread.title.trim()) return;

    try {
      const response = await fetch(`/api/resources/${courseId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title: newThread.title })
      });
      
      if (response.ok) {
        fetchThreads(); // Refresh the list
        setNewThread({ title: '' });
        setShowCreateForm(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create thread');
      }
    } catch (err) {
      console.error('Failed to create thread:', err);
      setError('Failed to create resource thread');
    }
  };

  const uploadFileToThread = async (threadId) => {
    if (!uploadFile || !uploadDescription.trim()) {
      setError('Please select a file and provide a description');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);

      const response = await fetch(`/api/resources/${courseId}/threads/${threadId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        fetchThreads(); // Refresh the list
        setUploadFile(null);
        setUploadDescription('');
        setUploadingToThread(null);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteThread = async (threadId) => {
    if (!confirm('Are you sure you want to delete this resource thread?')) return;

    try {
      const response = await fetch(`/api/resources/${courseId}/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchThreads(); // Refresh the list
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete thread');
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
      setError('Failed to delete thread');
    }
  };

  const downloadFile = (filePath, fileName) => {
    // Since the backend redirects to the file URL, we can just open it
    window.open(filePath, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Course Resources</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Thread
        </button>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Create Thread Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Resource Thread</h3>
            <form onSubmit={createThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewThread({ title: '' });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="space-y-6">
        {threads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No resource threads created yet</div>
            <p className="text-gray-500 mt-2">Create your first resource thread to get started</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.thread_id} className="bg-gray-800 rounded-lg shadow-lg">
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{thread.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Created by {thread.first_name} {thread.last_name} on {formatDate(thread.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setUploadingToThread(thread.thread_id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => deleteThread(thread.thread_id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload Form */}
              {uploadingToThread === thread.thread_id && (
                <div className="p-4 bg-gray-750 border-b border-gray-700">
                  <h4 className="font-medium mb-3">Upload File to Thread</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Select File</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description *</label>
                      <textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-20"
                        placeholder="Describe this file..."
                        required
                        rows="3"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => uploadFileToThread(thread.thread_id)}
                        disabled={uploading || !uploadFile || !uploadDescription.trim()}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        onClick={() => {
                          setUploadingToThread(null);
                          setUploadFile(null);
                          setUploadDescription('');
                        }}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Files List */}
              <div className="p-4">
                {thread.files && thread.files.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-200">Files ({thread.files.length})</h4>
                    {thread.files.map((file) => (
                      <div key={file.file_id} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-white">{file.file_name}</h5>
                            <p className="text-sm text-gray-300 mt-1">{file.description}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              Uploaded by {file.first_name} {file.last_name} on {formatDate(file.uploaded_at)}
                              {file.file_size && ` • ${formatFileSize(file.file_size)}`}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadFile(file.file_path, file.file_name)}
                            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No files uploaded yet</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
