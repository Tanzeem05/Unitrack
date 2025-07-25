// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { BarChart3, TrendingUp, Award, Calendar, CheckCircle, XCircle, Clock, Target } from 'lucide-react';

// const Results = ({ courseCode, courseId }) => {
//   const [assignments, setAssignments] = useState([]);
//   const [submissions, setSubmissions] = useState({});
//   const [courseStats, setCourseStats] = useState(null);
//   const [weeklyPerformance, setWeeklyPerformance] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchResults = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         // Fetch assignments
//         const assignmentsData = await api(`/assignments/course_code/${courseCode}`);
//         setAssignments(assignmentsData || []);
        
//         // Fetch weekly performance data
//         if (courseId) {
//           const weeklyData = await api(`/weekly-performance/course/${courseId}`);
//           setWeeklyPerformance(weeklyData || null);
//         }
        
//         // Fetch submissions for each assignment
//         if (assignmentsData && assignmentsData.length > 0) {
//           const submissionPromises = assignmentsData.map(async (assignment) => {
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
          
//           // Calculate course statistics
//           calculateCourseStats(assignmentsData, submissionsMap);
//         }
//       } catch (error) {
//         console.error('Error fetching results:', error);
//         setError('Failed to load course results');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseCode) {
//       fetchResults();
//     }
//   }, [courseCode, courseId]);

//   const calculateCourseStats = (assignmentsData, submissionsMap) => {
//     const totalAssignments = assignmentsData.length;
//     const submittedAssignments = Object.values(submissionsMap).filter(sub => sub !== null).length;
//     const gradedAssignments = Object.values(submissionsMap).filter(sub => sub && sub.grade !== null).length;
    
//     let totalPossiblePoints = 0;
//     let totalEarnedPoints = 0;
//     let totalWeightedScore = 0;
//     let totalWeight = 0;

//     assignmentsData.forEach(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       totalPossiblePoints += assignment.max_points || 0;
      
//       if (submission && submission.grade !== null) {
//         totalEarnedPoints += submission.grade;
//         // Calculate weighted score (assuming equal weight for now)
//         const weight = 1;
//         totalWeightedScore += (submission.grade / (assignment.max_points || 1)) * weight;
//         totalWeight += weight;
//       }
//     });

//     const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
//     const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

//     setCourseStats({
//       totalAssignments,
//       submittedAssignments,
//       gradedAssignments,
//       totalPossiblePoints,
//       totalEarnedPoints,
//       overallPercentage,
//       averageScore,
//       completionRate: totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0
//     });
//   };

//   const getGradeColor = (percentage) => {
//     if (percentage >= 90) return 'text-green-400';
//     if (percentage >= 80) return 'text-blue-400';
//     if (percentage >= 70) return 'text-yellow-400';
//     if (percentage >= 60) return 'text-orange-400';
//     return 'text-red-400';
//   };

//   const getLetterGrade = (percentage) => {
//     if (percentage >= 80) return 'A+';
//     if (percentage >= 75) return 'A';
//     if (percentage >= 70) return 'A-';
//     if (percentage >= 65) return 'B';
//     if (percentage >= 60) return 'B-';
//     if (percentage >= 55) return 'C';
//     if (percentage >= 50) return 'C-';
//     if (percentage >= 45) return 'D';
//     if (percentage >= 40) return 'D-';
//     return 'F';
//   };

//   if (loading) {
//     return <div className="text-center py-8">
//       <div className="text-white">Loading course results...</div>
//     </div>;
//   }

//   if (error) {
//     return <div className="text-center py-8">
//       <div className="text-red-400">Error: {error}</div>
//     </div>;
//   }

//   return (
//     <div className="space-y-8">
//       {/* Overall Performance Summary */}
//       {courseStats && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-green-300 text-sm font-medium">Final Grade</p>
//                 <p className={`text-3xl font-bold ${getGradeColor(courseStats.overallPercentage)}`}>
//                   {getLetterGrade(courseStats.overallPercentage)}
//                 </p>
//                 <p className="text-green-400 text-sm">
//                   {courseStats.overallPercentage.toFixed(1)}%
//                 </p>
//               </div>
//               <Award className="w-12 h-12 text-green-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-blue-300 text-sm font-medium">Total Points</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.totalEarnedPoints}
//                 </p>
//                 <p className="text-blue-400 text-sm">
//                   out of {courseStats.totalPossiblePoints}
//                 </p>
//               </div>
//               <Target className="w-12 h-12 text-blue-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-purple-300 text-sm font-medium">Completion Rate</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.completionRate.toFixed(0)}%
//                 </p>
//                 <p className="text-purple-400 text-sm">
//                   {courseStats.submittedAssignments}/{courseStats.totalAssignments} submitted
//                 </p>
//               </div>
//               <BarChart3 className="w-12 h-12 text-purple-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-6 border border-orange-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-orange-300 text-sm font-medium">Graded Items</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.gradedAssignments}
//                 </p>
//                 <p className="text-orange-400 text-sm">
//                   assignments graded
//                 </p>
//               </div>
//               <CheckCircle className="w-12 h-12 text-orange-400 opacity-80" />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Weekly Performance */}
//       {weeklyPerformance && weeklyPerformance.weekly_performance && weeklyPerformance.weekly_performance.length > 0 && (
//         <div className="bg-gray-800 rounded-xl p-6">
//           <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//             <Calendar className="w-6 h-6 text-purple-400" />
//             Weekly Performance Analysis
//           </h3>
          
//           {/* Performance Overview Chart */}
//           <div className="mb-8 bg-gray-700 rounded-lg p-6">
//             <h4 className="text-lg font-semibold text-white mb-4">Performance Overview</h4>
//             <div className="space-y-4">
//               {weeklyPerformance.weekly_performance.map((week) => (
//                 <div key={week.week_number} className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-300">
//                       Week {week.week_number}: {week.topic_title}
//                     </span>
//                     <span className="text-sm text-gray-400">
//                       {week.actual_performance}/{week.expected_performance} pts ({week.performance_percentage.toFixed(1)}%)
//                     </span>
//                   </div>
                  
//                   {/* Performance Bar Chart */}
//                   <div className="relative">
//                     {/* Expected Performance (Background) */}
//                     <div className="w-full bg-gray-600 rounded-full h-6 relative overflow-hidden">
//                       {/* Actual Performance */}
//                       <div 
//                         className={`h-6 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-semibold ${
//                           week.performance_percentage >= 90 ? 'bg-green-500' :
//                           week.performance_percentage >= 80 ? 'bg-blue-500' :
//                           week.performance_percentage >= 70 ? 'bg-yellow-500' :
//                           week.performance_percentage >= 60 ? 'bg-orange-500' :
//                           'bg-red-500'
//                         }`}
//                         style={{ width: `${Math.min(week.performance_percentage, 100)}%` }}
//                       >
//                         {week.performance_percentage > 20 && (
//                           <span className="text-white">
//                             {week.performance_percentage.toFixed(0)}%
//                           </span>
//                         )}
//                       </div>
                      
//                       {/* Expected Performance Line */}
//                       <div className="absolute top-0 right-0 w-1 h-6 bg-white opacity-50"></div>
//                     </div>
                    
//                     <div className="flex justify-between mt-1 text-xs text-gray-400">
//                       <span>Actual: {week.actual_performance} pts</span>
//                       <span>Expected: {week.expected_performance} pts</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           {/* Detailed Week Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {weeklyPerformance.weekly_performance.map((week) => {
//               return (
//                 <div key={week.week_number} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
//                   <div className="flex items-center justify-between mb-3">
//                     <div>
//                       <h4 className="text-lg font-semibold text-white">Week {week.week_number}</h4>
//                       <p className="text-sm text-gray-400">{week.topic_title}</p>
//                     </div>
//                     <div className="text-right">
//                       <div className={`text-xl font-bold ${getGradeColor(week.performance_percentage)}`}>
//                         {week.performance_percentage.toFixed(1)}%
//                       </div>
//                       <div className="text-xs text-gray-400">
//                         {week.actual_performance}/{week.expected_performance} pts
//                       </div>
//                     </div>
//                   </div>
                  
//                   {/* Performance vs Expected */}
//                   <div className="mb-3 space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-green-400">Expected</span>
//                       <span className="text-green-400">{week.expected_performance} pts</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-blue-400">Actual</span>
//                       <span className="text-blue-400">{week.actual_performance} pts</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className={week.actual_performance >= week.expected_performance ? 'text-green-400' : 'text-red-400'}>
//                         Difference
//                       </span>
//                       <span className={week.actual_performance >= week.expected_performance ? 'text-green-400' : 'text-red-400'}>
//                         {week.actual_performance >= week.expected_performance ? '+' : ''}{(week.actual_performance - week.expected_performance).toFixed(1)} pts
//                       </span>
//                     </div>
//                   </div>
                  
//                   {/* Progress Bar */}
//                   <div className="mb-3">
//                     <div className="w-full bg-gray-600 rounded-full h-2">
//                       <div 
//                         className={`h-2 rounded-full transition-all duration-300 ${
//                           week.performance_percentage >= 90 ? 'bg-green-500' :
//                           week.performance_percentage >= 80 ? 'bg-blue-500' :
//                           week.performance_percentage >= 70 ? 'bg-yellow-500' :
//                           week.performance_percentage >= 60 ? 'bg-orange-500' :
//                           'bg-red-500'
//                         }`}
//                         style={{ width: `${Math.min(week.performance_percentage, 100)}%` }}
//                       ></div>
//                     </div>
//                   </div>
                  
//                   {/* Assignment Stats */}
//                   <div className="flex items-center justify-between text-sm text-gray-400">
//                     <span>Assignments: {week.graded_assignments}/{week.total_assignments}</span>
//                     <span className="flex items-center gap-1">
//                       {week.total_assignments > 0 ? (
//                         week.graded_assignments === week.total_assignments ? (
//                           <CheckCircle className="w-4 h-4 text-green-400" />
//                         ) : week.graded_assignments > 0 ? (
//                           <Clock className="w-4 h-4 text-yellow-400" />
//                         ) : (
//                           <XCircle className="w-4 h-4 text-red-400" />
//                         )
//                       ) : (
//                         <span className="text-gray-500">No assignments</span>
//                       )}
//                     </span>
//                   </div>
                  
//                   {week.topic_description && (
//                     <div className="mt-3 pt-3 border-t border-gray-600">
//                       <p className="text-xs text-gray-400 line-clamp-2">{week.topic_description}</p>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Assignment Breakdown */}
//       <div className="bg-gray-800 rounded-xl p-6">
//         <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//           <TrendingUp className="w-6 h-6 text-blue-400" />
//           Assignment Performance
//         </h3>

//         {assignments.length === 0 ? (
//           <div className="text-center py-8 text-gray-400">
//             No assignments found for this course.
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {assignments.map((assignment) => {
//               const submission = submissions[assignment.assignment_id];
//               const maxPoints = assignment.max_points || 0;
//               const percentage = submission && submission.grade !== null 
//                 ? (submission.grade / maxPoints) * 100 
//                 : 0;
              
//               return (
//                 <div key={assignment.assignment_id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
//                   <div className="flex items-center justify-between mb-3">
//                     <div className="flex-1">
//                       <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
//                       <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
//                         <span className="flex items-center gap-1">
//                           <Calendar className="w-4 h-4" />
//                           Due: {new Date(assignment.due_date).toLocaleDateString()}
//                         </span>
//                         <span>Max: {maxPoints} points</span>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       {submission ? (
//                         submission.grade !== null ? (
//                           <div>
//                             <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
//                               {submission.grade}/{maxPoints}
//                             </div>
//                             <div className={`text-sm ${getGradeColor(percentage)}`}>
//                               {percentage.toFixed(1)}%
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="text-yellow-400">
//                             <Clock className="w-6 h-6 mx-auto mb-1" />
//                             <div className="text-sm">Pending</div>
//                           </div>
//                         )
//                       ) : (
//                         <div className="text-red-400">
//                           <XCircle className="w-6 h-6 mx-auto mb-1" />
//                           <div className="text-sm">Not Submitted</div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Progress Bar */}
//                   <div className="w-full bg-gray-600 rounded-full h-2">
//                     <div 
//                       className={`h-2 rounded-full transition-all duration-300 ${
//                         percentage >= 90 ? 'bg-green-500' :
//                         percentage >= 80 ? 'bg-blue-500' :
//                         percentage >= 70 ? 'bg-yellow-500' :
//                         percentage >= 60 ? 'bg-orange-500' :
//                         'bg-red-500'
//                       }`}
//                       style={{ width: `${submission && submission.grade !== null ? percentage : 0}%` }}
//                     ></div>
//                   </div>

//                   {submission && submission.feedback && (
//                     <div className="mt-3 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
//                       <p className="text-sm font-medium text-blue-300 mb-1">Instructor Feedback:</p>
//                       <p className="text-sm text-gray-300">{submission.feedback}</p>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Results;


import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { BarChart3, TrendingUp, Award, Calendar, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Results = ({ courseCode, courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [courseStats, setCourseStats] = useState(null);
  const [weeklyPerformance, setWeeklyPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch assignments
        const assignmentsData = await api(`/assignments/course_code/${courseCode}`);
        setAssignments(assignmentsData || []);
        
        // Fetch weekly performance data
        if (courseId) {
          const weeklyData = await api(`/weekly-performance/course/${courseId}`);
          setWeeklyPerformance(weeklyData || null);
        }
        
        // Fetch submissions for each assignment
        if (assignmentsData && assignmentsData.length > 0) {
          const submissionPromises = assignmentsData.map(async (assignment) => {
            try {
              const submission = await api(`/submissions/student/${assignment.assignment_id}`);
              return { assignmentId: assignment.assignment_id, submission };
            } catch (err) {
              return { assignmentId: assignment.assignment_id, submission: null };
            }
          });
          
          const submissionResults = await Promise.all(submissionPromises);
          const submissionsMap = {};
          submissionResults.forEach(({ assignmentId, submission }) => {
            submissionsMap[assignmentId] = submission;
          });
          setSubmissions(submissionsMap);
          
          // Calculate course statistics
          calculateCourseStats(assignmentsData, submissionsMap);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load course results');
      } finally {
        setLoading(false);
      }
    };

    if (courseCode) {
      fetchResults();
    }
  }, [courseCode, courseId]);

  const calculateCourseStats = (assignmentsData, submissionsMap) => {
    const totalAssignments = assignmentsData.length;
    const submittedAssignments = Object.values(submissionsMap).filter(sub => sub !== null).length;
    const gradedAssignments = Object.values(submissionsMap).filter(sub => sub && sub.grade !== null).length;
    
    let totalPossiblePoints = 0;
    let totalEarnedPoints = 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    assignmentsData.forEach(assignment => {
      const submission = submissionsMap[assignment.assignment_id];
      totalPossiblePoints += assignment.max_points || 0;
      
      if (submission && submission.grade !== null) {
        totalEarnedPoints += submission.grade;
        // Calculate weighted score (assuming equal weight for now)
        const weight = 1;
        totalWeightedScore += (submission.grade / (assignment.max_points || 1)) * weight;
        totalWeight += weight;
      }
    });

    const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
    const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    setCourseStats({
      totalAssignments,
      submittedAssignments,
      gradedAssignments,
      totalPossiblePoints,
      totalEarnedPoints,
      overallPercentage,
      averageScore,
      completionRate: totalAssignments > 0 ? (submittedAssignments / totalAssignments) * 100 : 0
    });
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 75) return 'A';
    if (percentage >= 70) return 'A-';
    if (percentage >= 65) return 'B';
    if (percentage >= 60) return 'B-';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'D-';
    return 'F';
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg shadow-lg">
          <p className="text-white font-semibold">{`Week ${label}: ${data.topic_title}`}</p>
          <p className="text-blue-400">{`Actual: ${data.actual_performance} pts`}</p>
          <p className="text-green-400">{`Expected: ${data.expected_performance} pts`}</p>
          <p className="text-yellow-400">{`Performance: ${data.performance_percentage.toFixed(1)}%`}</p>
          <p className="text-gray-400">{`Assignments: ${data.graded_assignments}/${data.total_assignments}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="text-center py-8">
      <div className="text-white">Loading course results...</div>
    </div>;
  }

  if (error) {
    return <div className="text-center py-8">
      <div className="text-red-400">Error: {error}</div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Overall Performance Summary */}
      {courseStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Final Grade</p>
                <p className={`text-3xl font-bold ${getGradeColor(courseStats.overallPercentage)}`}>
                  {getLetterGrade(courseStats.overallPercentage)}
                </p>
                <p className="text-green-400 text-sm">
                  {courseStats.overallPercentage.toFixed(1)}%
                </p>
              </div>
              <Award className="w-12 h-12 text-green-400 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold text-white">
                  {courseStats.totalEarnedPoints}
                </p>
                <p className="text-blue-400 text-sm">
                  out of {courseStats.totalPossiblePoints}
                </p>
              </div>
              <Target className="w-12 h-12 text-blue-400 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-white">
                  {courseStats.completionRate.toFixed(0)}%
                </p>
                <p className="text-purple-400 text-sm">
                  {courseStats.submittedAssignments}/{courseStats.totalAssignments} submitted
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-400 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-6 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">Graded Items</p>
                <p className="text-3xl font-bold text-white">
                  {courseStats.gradedAssignments}
                </p>
                <p className="text-orange-400 text-sm">
                  assignments graded
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-orange-400 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Weekly Performance Graph */}
      {weeklyPerformance && weeklyPerformance.weekly_performance && weeklyPerformance.weekly_performance.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Weekly Performance Analysis
          </h3>
          
          {/* Performance Line Chart */}
          <div className="mb-8 bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Performance Trend</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyPerformance.weekly_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="week_number" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expected_performance" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Expected Performance"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual_performance" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Actual Performance"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Percentage Bar Chart */}
          <div className="mb-8 bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Weekly Performance Percentage</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPerformance.weekly_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="week_number" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="performance_percentage" 
                    name="Performance %"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Topics Summary */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Weekly Topics Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyPerformance.weekly_performance.map((week) => (
                <div key={week.week_number} className="bg-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-white">Week {week.week_number}</h5>
                    <span className={`text-sm font-bold ${getGradeColor(week.performance_percentage)}`}>
                      {week.performance_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{week.topic_title}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{week.actual_performance}/{week.expected_performance} pts</span>
                    <span>{week.graded_assignments}/{week.total_assignments} assignments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Assignment Performance
        </h3>

        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No assignments found for this course.
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = submissions[assignment.assignment_id];
              const maxPoints = assignment.max_points || 0;
              const percentage = submission && submission.grade !== null 
                ? (submission.grade / maxPoints) * 100 
                : 0;
              
              return (
                <div key={assignment.assignment_id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        <span>Max: {maxPoints} points</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {submission ? (
                        submission.grade !== null ? (
                          <div>
                            <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                              {submission.grade}/{maxPoints}
                            </div>
                            <div className={`text-sm ${getGradeColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          <div className="text-yellow-400">
                            <Clock className="w-6 h-6 mx-auto mb-1" />
                            <div className="text-sm">Pending</div>
                          </div>
                        )
                      ) : (
                        <div className="text-red-400">
                          <XCircle className="w-6 h-6 mx-auto mb-1" />
                          <div className="text-sm">Not Submitted</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage >= 90 ? 'bg-green-500' :
                        percentage >= 80 ? 'bg-blue-500' :
                        percentage >= 70 ? 'bg-yellow-500' :
                        percentage >= 60 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${submission && submission.grade !== null ? percentage : 0}%` }}
                    ></div>
                  </div>

                  {submission && submission.feedback && (
                    <div className="mt-3 p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-blue-300 mb-1">Instructor Feedback:</p>
                      <p className="text-sm text-gray-300">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
