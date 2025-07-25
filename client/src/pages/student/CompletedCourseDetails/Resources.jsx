// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { FileText, Download, Folder, ExternalLink } from 'lucide-react';

// const Resources = ({ courseId }) => {
//   const [resources, setResources] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchResources = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         console.log(`Fetching resources for course ID: ${courseId}`);
//         const data = await api(`/course-resources/course/${courseId}`, 'GET');
//         console.log('Fetched resources data:', data);
        
//         if (data.error) {
//           setError(data.error);
//           setResources([]);
//         } else {
//           setResources(data || []);
//         }
//       } catch (error) {
//         console.error('Error fetching resources:', error);
//         setError('Failed to load resources');
//         setResources([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseId) {
//       fetchResources();
//     }
//   }, [courseId]);

//   const getResourceIcon = (type) => {
//     switch (type) {
//       case 'file':
//         return <FileText className="w-5 h-5 text-blue-400" />;
//       case 'folder':
//         return <Folder className="w-5 h-5 text-yellow-400" />;
//       case 'link':
//         return <ExternalLink className="w-5 h-5 text-green-400" />;
//       default:
//         return <FileText className="w-5 h-5 text-gray-400" />;
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   const handleResourceClick = (resource) => {
//     if (resource.type === 'link' && resource.url) {
//       window.open(resource.url, '_blank');
//     } else if (resource.file_path) {
//       // Handle file download
//       console.log('Download file:', resource.file_path);
//     }
//   };

//   if (loading) {
//     return <div className="text-center py-8">
//       <div className="text-white">Loading resources...</div>
//     </div>;
//   }

//   if (error) {
//     return <div className="text-center py-8">
//       <div className="text-red-400">Error: {error}</div>
//     </div>;
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-semibold text-white">Course Resources</h2>
//         <div className="text-sm text-gray-400">
//           {resources.length} resource{resources.length !== 1 ? 's' : ''}
//         </div>
//       </div>

//       {resources.length === 0 ? (
//         <div className="text-center py-12">
//           <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-400 mb-2">No Resources</h3>
//           <p className="text-gray-500">There are no resources available for this course.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {resources.map((resource) => (
//             <div
//               key={resource.resource_id}
//               onClick={() => handleResourceClick(resource)}
//               className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500"
//             >
//               <div className="flex items-start gap-3">
//                 {getResourceIcon(resource.type)}
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-semibold text-white mb-1 truncate">
//                     {resource.title}
//                   </h3>
//                   {resource.description && (
//                     <p className="text-gray-300 text-sm mb-2 line-clamp-2">
//                       {resource.description}
//                     </p>
//                   )}
//                   <div className="flex items-center justify-between text-xs text-gray-400">
//                     <span className="capitalize">{resource.type}</span>
//                     {resource.file_size && (
//                       <span>{formatFileSize(resource.file_size)}</span>
//                     )}
//                   </div>
//                   {resource.url && (
//                     <div className="mt-2">
//                       <span className="text-xs text-blue-400 truncate block">
//                         {resource.url}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//                 <Download className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Resources;


import { useState, useEffect } from 'react';

export default function StudentResources({ courseId }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const downloadFile = (filePath, fileName) => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Course Resources</h2>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Resource Threads */}
      <div className="space-y-4">
        {threads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No resource threads available</div>
            <p className="text-gray-500 mt-2">Your teacher hasn't uploaded any resources yet</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.thread_id} className="bg-gray-800 rounded-lg shadow-lg">
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-white">{thread.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Created by {thread.first_name} {thread.last_name} on {formatDate(thread.created_at)}
                  </p>
                </div>
              </div>

              {/* Files List */}
              <div className="p-4">
                {thread.files && thread.files.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-200">Available Files ({thread.files.length})</h4>
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
                            className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No files available in this thread</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

