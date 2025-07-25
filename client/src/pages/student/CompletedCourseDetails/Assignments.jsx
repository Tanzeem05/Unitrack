// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { CheckCircle, XCircle, Clock, FileText, Download } from 'lucide-react';

// export default function Assignments({ courseCode }) {
//   const [assignments, setAssignments] = useState([]);
//   const [submissions, setSubmissions] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAssignments = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         console.log('Fetching assignments for course code:', courseCode);
//         const data = await api(`/assignments/course_code/${courseCode}`);
//         console.log('Fetched assignments data:', data);
//         setAssignments(data || []);
        
//         // Fetch existing submissions for each assignment
//         if (data && data.length > 0) {
//           const submissionPromises = data.map(async (assignment) => {
//             try {
//               const submission = await api(`/submissions/student/${assignment.assignment_id}`);
//               return { assignmentId: assignment.assignment_id, submission };
//             } catch (err) {
//               return { assignmentId: assignment.assignment_id, submission: null };
//             }
//           });
          
//           const submissionResults = await Promise.all(submissionPromises);
//           const submissionsMap = {};
//           submissionResults.forEach(({ assignmentId, submission }) => {
//             submissionsMap[assignmentId] = submission;
//           });
//           setSubmissions(submissionsMap);
//         }
//       } catch (err) {
//         console.error('Error fetching assignments:', err);
//         setError('Failed to fetch assignments');
//         setAssignments([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseCode) {
//       fetchAssignments();
//     }
//   }, [courseCode]);

//   const getStatusIcon = (assignment, submission) => {
//     if (submission) {
//       if (submission.grade !== null) {
//         return <CheckCircle className="w-5 h-5 text-green-400" />;
//       } else {
//         return <Clock className="w-5 h-5 text-yellow-400" />;
//       }
//     } else {
//       const now = new Date();
//       const dueDate = new Date(assignment.due_date);
//       if (now > dueDate) {
//         return <XCircle className="w-5 h-5 text-red-400" />;
//       } else {
//         return <Clock className="w-5 h-5 text-gray-400" />;
//       }
//     }
//   };

//   const getStatusText = (assignment, submission) => {
//     if (submission) {
//       if (submission.grade !== null) {
//         return `Graded: ${submission.grade}/${assignment.max_score}`;
//       } else {
//         return 'Submitted - Pending Grade';
//       }
//     } else {
//       const now = new Date();
//       const dueDate = new Date(assignment.due_date);
//       if (now > dueDate) {
//         return 'Not Submitted';
//       } else {
//         return 'No Submission';
//       }
//     }
//   };

//   const getGradeColor = (submission, assignment) => {
//     if (!submission || submission.grade === null) return 'text-gray-400';
//     const percentage = (submission.grade / assignment.max_score) * 100;
//     if (percentage >= 90) return 'text-green-400';
//     if (percentage >= 80) return 'text-blue-400';
//     if (percentage >= 70) return 'text-yellow-400';
//     return 'text-red-400';
//   };

//   if (loading) return <div className="text-center text-gray-400">Loading assignments...</div>;
//   if (error) return <div className="text-center text-red-400">{error}</div>;
//   if (!assignments.length) return <div className="text-center text-gray-400">No assignments found for this course.</div>;

//   return (
//     <div>
//       <div className="mb-6">
//         <h2 className="text-xl font-semibold mb-2">Course Assignments</h2>
//         <p className="text-gray-400">Review your completed assignments and grades</p>
//       </div>

//       <div className="space-y-4">
//         {assignments.map((assignment) => {
//           const submission = submissions[assignment.assignment_id];
//           return (
//             <div key={assignment.assignment_id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-3 mb-2">
//                     {getStatusIcon(assignment, submission)}
//                     <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
//                   </div>
//                   <p className="text-gray-300 mb-3">{assignment.description}</p>
//                   <div className="flex items-center space-x-6 text-sm text-gray-400">
//                     <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
//                     <span>Max Score: {assignment.max_score} points</span>
//                   </div>
//                 </div>
//                 <div className="text-right ml-4">
//                   <div className={`text-lg font-bold ${getGradeColor(submission, assignment)}`}>
//                     {submission && submission.grade !== null 
//                       ? `${submission.grade}/${assignment.max_score}`
//                       : 'Not Graded'
//                     }
//                   </div>
//                   <div className="text-sm text-gray-400">
//                     {getStatusText(assignment, submission)}
//                   </div>
//                 </div>
//               </div>

//               {submission && (
//                 <div className="mt-4 p-4 bg-gray-800 rounded-lg">
//                   <div className="flex items-center justify-between mb-2">
//                     <h4 className="text-sm font-medium text-white">Your Submission</h4>
//                     <span className="text-xs text-gray-400">
//                       Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
//                     </span>
//                   </div>
                  
//                   {submission.submission_text && (
//                     <div className="mb-3">
//                       <p className="text-gray-300 text-sm">{submission.submission_text}</p>
//                     </div>
//                   )}

//                   {submission.file_path && (
//                     <div className="flex items-center space-x-2">
//                       <FileText className="w-4 h-4 text-blue-400" />
//                       <span className="text-sm text-blue-400">
//                         {submission.file_path.split('/').pop()}
//                       </span>
//                       <button className="text-xs text-gray-400 hover:text-white transition-colors">
//                         <Download className="w-3 h-3" />
//                       </button>
//                     </div>
//                   )}

//                   {submission.feedback && (
//                     <div className="mt-3 p-3 bg-gray-900 rounded">
//                       <h5 className="text-xs font-medium text-white mb-1">Instructor Feedback:</h5>
//                       <p className="text-sm text-gray-300">{submission.feedback}</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../../utils/api';

export default function Assignments({ courseCode }) {
  const location = useLocation();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({}); // Store submissions by assignment ID
  const [files, setFiles] = useState({}); // Store files by assignment ID
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({}); // Track submitting state by assignment ID
  const [error, setError] = useState(null);
  const [highlightedAssignment, setHighlightedAssignment] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching assignments for course code:', courseCode);
        const data = await api(`/assignments/course_code/${courseCode}`);
        console.log('Fetched assignments data:', data);
        setAssignments(data || []);
        
        // Fetch existing submissions for each assignment
        if (data && data.length > 0) {
          const submissionPromises = data.map(async (assignment) => {
            try {
              const submission = await api(`/submissions/student/${assignment.assignment_id}`);
              return { assignmentId: assignment.assignment_id, submission };
            } catch (err) {
              // If no submission found, return null
              return { assignmentId: assignment.assignment_id, submission: null };
            }
          });
          
          const submissionResults = await Promise.all(submissionPromises);
          const submissionsMap = {};
          submissionResults.forEach(({ assignmentId, submission }) => {
            submissionsMap[assignmentId] = submission;
          });
          setSubmissions(submissionsMap);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to fetch assignments');
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (courseCode) {
      fetchAssignments();
    }
  }, [courseCode]);

  // Handle assignment highlighting from query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const assignmentId = searchParams.get('assignmentId');
    
    if (assignmentId && assignments.length > 0) {
      const assignmentIdNum = parseInt(assignmentId);
      const assignment = assignments.find(a => a.assignment_id === assignmentIdNum);
      
      if (assignment) {
        setHighlightedAssignment(assignmentIdNum);
        
        // Scroll to the assignment after a small delay to ensure rendering
        setTimeout(() => {
          const element = document.getElementById(`assignment-${assignmentIdNum}`);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedAssignment(null);
        }, 3000);
      }
    }
  }, [location.search, assignments]);

  const handleFileChange = (assignmentId, file) => {
    setFiles(prev => ({
      ...prev,
      [assignmentId]: file
    }));
  };

  const handleSubmit = async (e, assignmentId) => {
    e.preventDefault();
    const file = files[assignmentId];
    
    if (!file) {
      alert('Please select a file to submit.');
      return;
    }

    // Check if assignment is overdue
    const assignment = assignments.find(a => a.assignment_id === assignmentId);
    if (assignment && isOverdue(assignment.due_date)) {
      alert('Cannot submit assignment. The deadline has passed.');
      return;
    }
    
    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignment_id', assignmentId);
    
    try {
      console.log('Submitting assignment:', { assignmentId, fileName: file.name });
      
      const result = await api('/submissions', 'POST', formData, true);
      
      console.log('Submission result:', result);
      
      // Update the submissions state with the new submission
      setSubmissions(prev => ({
        ...prev,
        [assignmentId]: result.submission
      }));
      
      // Clear the file for this assignment
      setFiles(prev => ({
        ...prev,
        [assignmentId]: null
      }));
      
      // Reset the file input element for this assignment
      const fileInput = document.querySelector(`input[data-assignment-id="${assignmentId}"]`);
      if (fileInput) fileInput.value = '';
      
      alert(submissions[assignmentId] ? 'Assignment resubmitted successfully!' : 'Assignment submitted successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
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

  const isOverdue = (dueDateString) => {
    return new Date(dueDateString) < new Date();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Assignments</h2>
      
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && <div className="bg-red-600 text-white p-3 rounded-lg mb-4">{error}</div>}
      
      {!loading && !error && assignments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No assignments found</div>
          <p className="text-gray-500 mt-2">No assignments have been posted for this course yet</p>
        </div>
      )}
      
      {assignments.map(assignment => {
        const submission = submissions[assignment.assignment_id];
        const overdue = isOverdue(assignment.due_date);
        const isSubmitting = submitting[assignment.assignment_id];
        const isHighlighted = highlightedAssignment === assignment.assignment_id;
        
        return (
          <div 
            key={assignment.assignment_id} 
            id={`assignment-${assignment.assignment_id}`}
            className={`
              bg-gray-800 rounded-lg p-6 shadow-lg transition-all duration-500
              ${isHighlighted 
                ? 'transform scale-105 ring-4 ring-blue-400 ring-opacity-50 bg-blue-900/20' 
                : ''
              }
            `}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{assignment.title}</h3>
                <p className="text-gray-300 mb-3">{assignment.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Due Date:</span>
                    <p className={`${overdue ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(assignment.due_date)}
                      {overdue && ' (Overdue)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Points:</span>
                    <p className="text-white">{assignment.max_points}</p>
                  </div>
                </div>
              </div>
              
              {assignment.file_url && (
                <a
                  href={assignment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Download Assignment
                </a>
              )}
            </div>

            {/* Existing Submission Info */}
            {submission && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-green-400 mb-2">
                  ✓ Submitted on {formatDate(submission.submitted_at)}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Grade:</span>
                    <p className="text-white">
                      {submission.points_earned !== null 
                        ? `${submission.points_earned}/${assignment.max_points}` 
                        : 'Not graded yet'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Feedback:</span>
                    <p className="text-gray-300">
                      {submission.feedback || 'No feedback yet'}
                    </p>
                  </div>
                </div>
                
                {submission.file_url && (
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-400 hover:underline text-sm"
                  >
                    View Submitted File
                  </a>
                )}
                
                {submission.graded_at && (
                  <p className="text-gray-400 text-xs mt-2">
                    Graded on {formatDate(submission.graded_at)}
                  </p>
                )}
              </div>
            )}

            {/* Submission Form */}
            <div className="border-t border-gray-700 pt-4">
              {overdue ? (
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
                  <h4 className="font-medium text-red-300 mb-2">
                    Submission Deadline Passed
                  </h4>
                  <p className="text-red-400 text-sm">
                    This assignment deadline has passed. Submissions are no longer accepted.
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-white mb-3">
                    {submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                  </h4>
                  
                  <form onSubmit={(e) => handleSubmit(e, assignment.assignment_id)} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Select File
                      </label>
                      <input 
                        type="file" 
                        data-assignment-id={assignment.assignment_id}
                        onChange={(e) => handleFileChange(assignment.assignment_id, e.target.files[0])} 
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white file:cursor-pointer"
                        required 
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !files[assignment.assignment_id]}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>{submission ? 'Resubmit' : 'Submit'}</span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

