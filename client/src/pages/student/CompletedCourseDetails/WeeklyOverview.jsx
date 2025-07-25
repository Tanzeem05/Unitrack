// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { Calendar, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// const WeeklyOverview = ({ courseId, courseCode }) => {
//   const [weeks, setWeeks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchWeeks = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         console.log(`Fetching weeks for course ID: ${courseId}`);
//         const data = await api(`/course-weeks/course/${courseId}`, 'GET');
//         console.log('Fetched weeks data:', data);
        
//         if (data.error) {
//           setError(data.error);
//           setWeeks([]);
//         } else {
//           setWeeks(data || []);
//         }
//       } catch (error) {
//         console.error('Error fetching weeks:', error);
//         setError('Failed to load weekly overview');
//         setWeeks([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseId) {
//       fetchWeeks();
//     }
//   }, [courseId]);

//   const getWeekStatus = (week) => {
//     const now = new Date();
//     const startDate = new Date(week.start_date);
//     const endDate = new Date(week.end_date);
    
//     if (now > endDate) {
//       return { status: 'completed', icon: CheckCircle, color: 'text-green-400' };
//     } else if (now >= startDate && now <= endDate) {
//       return { status: 'current', icon: Clock, color: 'text-yellow-400' };
//     } else {
//       return { status: 'upcoming', icon: AlertCircle, color: 'text-gray-400' };
//     }
//   };

//   if (loading) {
//     return <div className="text-center py-8">
//       <div className="text-white">Loading weekly overview...</div>
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
//         <h3 className="text-lg font-semibold text-white">Weekly Overview</h3>
//         <div className="text-sm text-gray-400">
//           {weeks.length} week{weeks.length !== 1 ? 's' : ''}
//         </div>
//       </div>

//       {weeks.length === 0 ? (
//         <div className="text-center py-8">
//           <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-400 mb-2">No Weekly Schedule</h3>
//           <p className="text-gray-500">Weekly content has not been set up for this course yet.</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {weeks.map((week) => {
//             const { status, icon: StatusIcon, color } = getWeekStatus(week);
            
//             return (
//               <div
//                 key={week.week_id}
//                 className="bg-gray-700 rounded-lg p-4 border border-gray-600"
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <StatusIcon className={`w-5 h-5 ${color}`} />
//                     <div>
//                       <h4 className="font-semibold text-white">
//                         Week {week.week_number}: {week.title}
//                       </h4>
//                       <p className="text-sm text-gray-400">
//                         {new Date(week.start_date).toLocaleDateString()} - {new Date(week.end_date).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className={`text-sm font-medium ${color} capitalize`}>
//                       {status}
//                     </span>
//                     <ChevronRight className="w-4 h-4 text-gray-400" />
//                   </div>
//                 </div>
                
//                 {week.description && (
//                   <div className="mt-3 pl-8">
//                     <p className="text-gray-300 text-sm">{week.description}</p>
//                   </div>
//                 )}
                
//                 {week.learning_objectives && (
//                   <div className="mt-3 pl-8">
//                     <h5 className="text-sm font-medium text-white mb-1">Learning Objectives:</h5>
//                     <p className="text-gray-300 text-sm">{week.learning_objectives}</p>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default WeeklyOverview;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';

export default function WeeklyOverview({ courseId, courseCode }) {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoading(true);
        const data = await api(`/course-weeks/course/${courseId}/weeks`);
        setWeeks(data || []);
        
        // Determine current week based on today's date
        const today = new Date();
        const current = data.find(week => {
          const startDate = new Date(week.start_date);
          const endDate = new Date(week.end_date);
          return today >= startDate && today <= endDate;
        });
        setCurrentWeek(current?.week_number || null);
      } catch (err) {
        console.error('Failed to fetch course weeks:', err);
        setError('Failed to load weekly overview.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchWeeks();
    }
  }, [courseId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getWeekStatus = (week) => {
    const today = new Date();
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    
    if (today < startDate) return 'upcoming';
    if (today >= startDate && today <= endDate) return 'current';
    return 'completed';
  };

  const toggleWeekExpansion = (weekId) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const handleAssignmentClick = (assignment, courseCode) => {
    // Navigate to assignments tab with assignment ID as query parameter
    navigate(`/student/courses/${encodeURIComponent(courseCode)}/assignments?assignmentId=${assignment.assignment_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-300">Loading weekly overview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-300">No weekly schedule available yet.</p>
        <p className="text-gray-400 text-sm mt-2">
          Your instructor will set up the weekly topics soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Weekly Overview</h3>
        {currentWeek && (
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Currently Week {currentWeek}
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {weeks.map((week) => {
          const status = getWeekStatus(week);
          const isCurrentWeek = week.week_number === currentWeek;
          const isExpanded = expandedWeek === week.week_id;
          
          return (
            <div
              key={week.week_id}
              className={`
                border rounded-lg transition-all duration-200 cursor-pointer
                ${isCurrentWeek 
                  ? 'border-blue-500 bg-blue-900/20 shadow-lg' 
                  : status === 'completed' 
                    ? 'border-gray-600 bg-gray-800/50' 
                    : 'border-gray-700 bg-gray-800'
                }
                ${isExpanded ? 'ring-2 ring-blue-400/50' : ''}
              `}
            >
              {/* Week Header - Clickable */}
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleWeekExpansion(week.week_id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCurrentWeek 
                      ? 'bg-blue-500 text-white' 
                      : status === 'completed' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }
                  `}>
                    {week.week_number}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Week {week.week_number}
                      {week.topic_title && (
                        <span className="text-gray-300 font-normal"> - {week.topic_title}</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {formatDate(week.start_date)} - {formatDate(week.end_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`
                    px-2 py-1 rounded text-xs font-medium uppercase tracking-wide
                    ${status === 'current' 
                      ? 'bg-blue-500 text-white' 
                      : status === 'completed' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }
                  `}>
                    {status}
                  </div>
                  
                  {/* Assignment count badge */}
                  {week.assignments && week.assignments.length > 0 && (
                    <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {week.assignments.length} assignment{week.assignments.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Expand/Collapse icon */}
                  <div className={`
                    transform transition-transform duration-200 text-gray-400
                    ${isExpanded ? 'rotate-180' : ''}
                  `}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Expanded Week Content */}
              {isExpanded && (
                <div className="border-t border-gray-600 p-4 space-y-4 bg-gray-800/30">
                  {/* Topic and Description */}
                  {week.topic_title || week.topic_description ? (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h5 className="font-medium text-white mb-2 flex items-center">
                        📚 Topic Overview
                      </h5>
                      {week.topic_title && (
                        <h6 className="font-semibold text-blue-300 mb-1">
                          {week.topic_title}
                        </h6>
                      )}
                      {week.topic_description && (
                        <p className="text-gray-300 text-sm">
                          {week.topic_description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-sm">
                        📚 No topic information available yet
                      </p>
                    </div>
                  )}

                  {/* Learning Objectives */}
                  {week.learning_objectives && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <h6 className="font-medium text-white mb-2 flex items-center">
                        🎯 Learning Objectives
                      </h6>
                      <p className="text-gray-300 text-sm">
                        {week.learning_objectives}
                      </p>
                    </div>
                  )}

                  {/* Assignments */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h6 className="font-medium text-white mb-3 flex items-center">
                      📝 Assignments & Tasks
                    </h6>
                    {week.assignments && week.assignments.length > 0 ? (
                      <div className="space-y-2">
                        {week.assignments.map((assignment) => {
                          const dueDate = new Date(assignment.due_date);
                          const isOverdue = dueDate < new Date() && status !== 'completed';
                          const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div
                              key={assignment.assignment_id}
                              onClick={() => handleAssignmentClick(assignment, courseCode)}
                              className={`
                                p-3 rounded border-l-4 cursor-pointer transition-all duration-200 hover:bg-opacity-80 hover:shadow-md
                                ${isOverdue 
                                  ? 'bg-red-900/20 border-red-500 hover:bg-red-900/30' 
                                  : daysDiff <= 3 && daysDiff >= 0
                                    ? 'bg-yellow-900/20 border-yellow-500 hover:bg-yellow-900/30'
                                    : 'bg-blue-900/20 border-blue-400 hover:bg-blue-900/30'
                                }
                              `}
                              title="Click to view assignment details"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                  <h7 className="font-medium text-white">
                                    {assignment.title}
                                  </h7>
                                  <span className="text-xs text-gray-400">
                                    👆 Click to view
                                  </span>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className={`
                                    text-xs px-2 py-1 rounded font-medium
                                    ${isOverdue 
                                      ? 'bg-red-600 text-white' 
                                      : daysDiff <= 3 && daysDiff >= 0
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }
                                  `}>
                                    Due: {dueDate.toLocaleDateString()}
                                  </span>
                                  {daysDiff >= 0 && daysDiff <= 7 && (
                                    <span className="text-xs text-gray-400">
                                      {daysDiff === 0 ? 'Due today!' : 
                                       daysDiff === 1 ? 'Due tomorrow' : 
                                       `${daysDiff} days left`}
                                    </span>
                                  )}
                                  {assignment.max_points && (
                                    <span className="text-xs text-gray-400">
                                      {assignment.max_points} points
                                    </span>
                                  )}
                                </div>
                              </div>
                              {assignment.description && (
                                <p className="text-gray-300 text-sm mb-2">
                                  {assignment.description.length > 150 
                                    ? assignment.description.substring(0, 150) + '...'
                                    : assignment.description
                                  }
                                </p>
                              )}
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">
                                  Assignment #{assignment.assignment_id}
                                </span>
                                {status === 'current' || status === 'upcoming' ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignmentClick(assignment, courseCode);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    View Assignment
                                  </button>
                                ) : (
                                  <span className="text-green-400 text-xs">
                                    ✓ Week completed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-600 rounded">
                        <p className="text-gray-400 text-sm">
                          📝 No assignments for this week
                        </p>
                        {status === 'upcoming' && (
                          <p className="text-gray-500 text-xs mt-1">
                            Assignments may be added later
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Week Summary */}
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <h6 className="font-medium text-white mb-2 flex items-center">
                      📊 Week Summary
                    </h6>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 font-medium ${
                          status === 'current' ? 'text-blue-400' :
                          status === 'completed' ? 'text-green-400' :
                          'text-gray-300'
                        }`}>
                          {status === 'current' ? 'In Progress' :
                           status === 'completed' ? 'Completed' :
                           'Upcoming'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Assignments:</span>
                        <span className="ml-2 font-medium text-white">
                          {week.assignments?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-2 font-medium text-white">
                          7 days
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Week:</span>
                        <span className="ml-2 font-medium text-white">
                          {week.week_number} of {weeks.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Course Progress */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Course Progress</h4>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, ((currentWeek || 0) / weeks.length) * 100)}%`
            }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>
            Week {currentWeek || 0} of {weeks.length}
          </span>
          <span>
            {Math.min(100, Math.round(((currentWeek || 0) / weeks.length) * 100))}% Complete
          </span>
        </div>
      </div>
    </div>
  );
}
