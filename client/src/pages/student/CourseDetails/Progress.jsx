// import { useState, useEffect } from 'react';
// import { api } from '../../../utils/api';
// import { BarChart3, TrendingUp, Calendar, CheckCircle, XCircle, Clock, Target, AlertCircle } from 'lucide-react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart, ComposedChart } from 'recharts';

// const Progress = ({ courseCode, courseId }) => {
//   const [assignments, setAssignments] = useState([]);
//   const [submissions, setSubmissions] = useState({});
//   const [courseStats, setCourseStats] = useState(null);
//   const [weeklyPerformance, setWeeklyPerformance] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProgress = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         // Fetch assignments
//         const assignmentsData = await api(`/assignments/course_code/${courseCode}`);
//         setAssignments(assignmentsData || []);
        
//         // Fetch weekly performance data
//         if (courseId) {
//           try {
//             const weeklyData = await api(`/weekly-performance/course/${courseId}`);
//             console.log('Weekly performance data received:', weeklyData);
//             if (weeklyData && weeklyData.weekly_performance) {
//               console.log('First week data sample:', weeklyData.weekly_performance[0]);
//             }
//             setWeeklyPerformance(weeklyData || null);
//           } catch (err) {
//             console.error('Error fetching weekly performance:', err);
//             setWeeklyPerformance(null);
//           }
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
//         console.error('Error fetching progress:', error);
//         setError('Failed to load course progress');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseCode) {
//       fetchProgress();
//     }
//   }, [courseCode, courseId]);

//   const calculateCourseStats = (assignmentsData, submissionsMap) => {
//     const totalAssignments = assignmentsData.length;
//     const submittedAssignments = Object.values(submissionsMap).filter(sub => sub !== null).length;
//     const gradedAssignments = Object.values(submissionsMap).filter(sub => sub && sub.points_earned !== null).length;
    
//     const pendingAssignments = assignmentsData.filter(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       return !submission || submission.points_earned === null;
//     }).length;
    
//     let totalPossiblePoints = 0;
//     let totalEarnedPoints = 0;
//     let totalGradedPossiblePoints = 0;
//     let totalWeightedScore = 0;
//     let totalWeight = 0;

//     assignmentsData.forEach(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       totalPossiblePoints += assignment.max_points || 0;
      
//       const assignmentDueDate = new Date(assignment.due_date);
//       const currentDate = new Date();
//       const isDeadlinePassed = assignmentDueDate < currentDate;
      
//       if (submission && submission.points_earned !== null) {
//         totalEarnedPoints += Number(submission.points_earned);
//         const weight = 1;
//         totalWeightedScore += (submission.points_earned / (assignment.max_points || 1)) * weight;
//         totalWeight += weight;
//       }
      
//       if ((submission && submission.points_earned !== null) || isDeadlinePassed) {
//         totalGradedPossiblePoints += Number(assignment.max_points || 0);
//       }
//     });

//     const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
//     const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

//     setCourseStats({
//       totalAssignments,
//       submittedAssignments,
//       gradedAssignments,
//       pendingAssignments,
//       totalPossiblePoints,
//       totalGradedPossiblePoints,
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

//   const getPendingAssignments = () => {
//     return assignments.filter(assignment => {
//       const submission = submissions[assignment.assignment_id];
//       return !submission;
//     });
//   };

//   const getUpcomingDeadlines = () => {
//     const pendingAssignments = getPendingAssignments();
//     const today = new Date();
    
//     return pendingAssignments
//       .filter(assignment => new Date(assignment.due_date) >= today)
//       .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
//       .slice(0, 5);
//   };

//   // Enhanced Custom Tooltips for Real Data
//   const WeeklyPointsTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
//           <p className="text-white font-semibold mb-2">{`Week ${label}: ${data.topic_title || 'Week ' + label}`}</p>
//           <div className="space-y-1">
//             <p className="text-blue-400 flex items-center justify-between">
//               <span>Earned Points:</span>
//               <span className="font-medium">{data.total_earned_points || 0} pts</span>
//             </p>
//             <p className="text-green-400 flex items-center justify-between">
//               <span>Total Possible:</span>
//               <span className="font-medium">{data.total_possible_points || 0} pts</span>
//             </p>
//             <p className="text-purple-400 flex items-center justify-between">
//               <span>Performance:</span>
//               <span className="font-medium">{data.performance_percentage ? data.performance_percentage.toFixed(1) : 0}%</span>
//             </p>
//             <p className="text-gray-400 flex items-center justify-between">
//               <span>Assignments:</span>
//               <span className="font-medium">{data.graded_assignments || 0}/{data.total_assignments || 0}</span>
//             </p>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const PerformanceBarTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
//           <p className="text-white font-semibold mb-2">{`Week ${label}`}</p>
//           <p className="text-purple-400">{`Performance: ${data.performance_percentage ? data.performance_percentage.toFixed(1) : 0}%`}</p>
//           <p className="text-gray-300 text-sm">{data.topic_title || `Week ${label} Content`}</p>
//         </div>
//       );
//     }
//     return null;
//   };

//   // Process data for trend analysis with real backend data
//   const getPerformanceTrendData = () => {
//     if (!weeklyPerformance?.weekly_performance) {
//       console.log('No weekly performance data available for charts');
//       return [];
//     }
    
//     console.log('Processing weekly performance data for charts:', weeklyPerformance.weekly_performance);
    
//     const processedData = weeklyPerformance.weekly_performance.map((week, index) => {
//       const earnedPoints = Number(week.total_earned_points) || 0;
//       const possiblePoints = Number(week.total_possible_points) || 0;
//       const performancePercentage = possiblePoints > 0 ? (earnedPoints / possiblePoints) * 100 : 0;
      
//       const result = {
//         week_number: week.week_number || (index + 1),
//         topic_title: week.topic_title || `Week ${week.week_number || (index + 1)}`,
//         total_earned_points: earnedPoints,
//         total_possible_points: possiblePoints,
//         performance_percentage: performancePercentage,
//         graded_assignments: week.graded_assignments || 0,
//         total_assignments: week.total_assignments || 0,
//         submission_rate: week.total_assignments > 0 ? 
//           ((week.graded_assignments || 0) / week.total_assignments) * 100 : 0
//       };
      
//       console.log(`Week ${result.week_number} processed:`, result);
//       return result;
//     });
    
//     console.log('Final processed chart data:', processedData);
//     return processedData;
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <div className="text-white text-lg">Loading course progress...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-16">
//         <div className="text-red-400 text-lg">Error: {error}</div>
//       </div>
//     );
//   }

//   const trendData = getPerformanceTrendData();

//   return (
//     <div className="space-y-8">
//       {/* Current Progress Summary */}
//       {courseStats && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-blue-300 text-sm font-medium">Total Points</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.totalEarnedPoints}
//                 </p>
//                 <p className="text-blue-400 text-sm">
//                   out of {courseStats.totalGradedPossiblePoints} 
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

//           <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-green-300 text-sm font-medium">Graded Assignments</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.gradedAssignments}
//                 </p>
//                 <p className="text-green-400 text-sm">
//                   assignments graded
//                 </p>
//               </div>
//               <CheckCircle className="w-12 h-12 text-green-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-red-300 text-sm font-medium">Pending Assignments</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.pendingAssignments}
//                 </p>
//                 <p className="text-red-400 text-sm">
//                   assignments pending
//                 </p>
//               </div>
//               <AlertCircle className="w-12 h-12 text-red-400 opacity-80" />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Weekly Performance Analysis */}
//       {weeklyPerformance && weeklyPerformance.weekly_performance && weeklyPerformance.weekly_performance.length > 0 ? (
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h3 className="text-xl font-semibold text-white flex items-center gap-2">
//               <TrendingUp className="w-6 h-6 text-blue-400" />
//               Performance Analytics
//             </h3>
//             <div className="flex gap-3 text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 bg-blue-500 rounded"></div>
//                 <span className="text-gray-300">Actual</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 bg-green-500 rounded border-2 border-green-500" style={{background: 'transparent'}}></div>
//                 <span className="text-gray-300">Expected</span>
//               </div>
//             </div>
//           </div>
          
//           {/* Main Performance Trend Chart - Total vs Earned Points */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//             <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//               <h4 className="text-lg font-semibold text-white mb-4">Weekly Points Progress</h4>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="earnedGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
//                         <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
//                     <XAxis 
//                       dataKey="week_number" 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                       label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
//                     />
//                     <YAxis 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                       label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
//                     />
//                     <Tooltip content={<WeeklyPointsTooltip />} />
//                     <Legend wrapperStyle={{ color: '#9CA3AF' }} />
//                     <Bar
//                       dataKey="total_possible_points"
//                       fill="#374151"
//                       name="Total Possible Points"
//                       radius={[4, 4, 0, 0]}
//                     />
//                     <Area
//                       type="monotone"
//                       dataKey="total_earned_points"
//                       stroke="#3B82F6"
//                       strokeWidth={3}
//                       fill="url(#earnedGradient)"
//                       name="Earned Points"
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="total_possible_points" 
//                       stroke="#10B981" 
//                       strokeWidth={2}
//                       strokeDasharray="5 5"
//                       name="Target Points"
//                       dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
//                     />
//                   </ComposedChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//               <h4 className="text-lg font-semibold text-white mb-4">Weekly Performance Percentage</h4>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
//                         <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
//                     <XAxis 
//                       dataKey="week_number" 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                       label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
//                     />
//                     <YAxis 
//                       domain={[0, 100]}
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                       label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
//                     />
//                     <Tooltip content={<PerformanceBarTooltip />} />
//                     <Bar 
//                       dataKey="performance_percentage" 
//                       name="Performance %"
//                       fill="url(#barGradient)"
//                       radius={[4, 4, 0, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           {/* Weekly Topics Summary with Enhanced Styling */}
//           <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//             <h4 className="text-lg font-semibold text-white mb-6">Weekly Topics Overview</h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {weeklyPerformance.weekly_performance.map((week) => (
//                 <div key={week.week_number} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
//                   <div className="flex justify-between items-start mb-3">
//                     <h5 className="font-semibold text-white">Week {week.week_number}</h5>
//                     <span className={`text-sm font-bold px-2 py-1 rounded ${getGradeColor(week.performance_percentage)}`}>
//                       {week.performance_percentage.toFixed(1)}%
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-300 mb-3 line-clamp-2">{week.topic_title}</p>
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-xs text-gray-400">
//                       <span>Points:</span>
//                       <span className="text-white">{week.total_earned_points || 0}/{week.total_possible_points || 0}</span>
//                     </div>
//                     <div className="flex justify-between text-xs text-gray-400">
//                       <span>Assignments:</span>
//                       <span className="text-white">{week.graded_assignments}/{week.total_assignments}</span>
//                     </div>
//                     <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
//                       <div 
//                         className={`h-2 rounded-full transition-all duration-300 ${
//                           week.performance_percentage >= 90 ? 'bg-green-500' :
//                           week.performance_percentage >= 80 ? 'bg-blue-500' :
//                           week.performance_percentage >= 70 ? 'bg-yellow-500' :
//                           week.performance_percentage >= 60 ? 'bg-orange-500' :
//                           'bg-red-500'
//                         }`}
//                         style={{ width: `${week.performance_percentage}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="bg-gray-800 rounded-xl p-6">
//           <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//             <Calendar className="w-6 h-6 text-purple-400" />
//             Weekly Performance Analysis
//           </h3>
//           <div className="text-center py-8 text-gray-400">
//             <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
//             <p className="text-lg">No weekly performance data available yet.</p>
//             <p className="text-sm">Weekly data will appear as assignments are completed and graded.</p>
//           </div>
//         </div>
//       )}

//       {/* Pending Assignments Section */}
//       <div className="bg-gray-800 rounded-xl p-6">
//         <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//           <AlertCircle className="w-6 h-6 text-red-400" />
//           Pending Assignments
//         </h3>

//         {getPendingAssignments().length === 0 ? (
//           <div className="text-center py-8 text-gray-400">
//             <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
//             <p className="text-lg">Great job! All assignments have been submitted.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {getUpcomingDeadlines().length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
//                   <Clock className="w-5 h-5 text-yellow-400" />
//                   Upcoming Deadlines
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {getUpcomingDeadlines().map((assignment) => {
//                     const dueDate = new Date(assignment.due_date);
//                     const today = new Date();
//                     const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
//                     return (
//                       <div key={assignment.assignment_id} className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
//                         <h5 className="font-semibold text-white mb-2">{assignment.title}</h5>
//                         <div className="text-sm text-yellow-300">
//                           <p className="flex items-center gap-1 mb-1">
//                             <Calendar className="w-4 h-4" />
//                             Due: {dueDate.toLocaleDateString()}
//                           </p>
//                           <p className={`font-medium ${
//                             daysUntilDue <= 1 ? 'text-red-400' : 
//                             daysUntilDue <= 3 ? 'text-orange-400' : 'text-yellow-400'
//                           }`}>
//                             {daysUntilDue === 0 ? 'Due Today!' : 
//                              daysUntilDue === 1 ? 'Due Tomorrow' : 
//                              `${daysUntilDue} days remaining`}
//                           </p>
//                           <p className="text-gray-400">Max: {assignment.max_points} points</p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             <div>
//               <h4 className="text-lg font-semibold text-white mb-4">All Pending Assignments</h4>
//               <div className="space-y-3">
//                 {getPendingAssignments().map((assignment) => {
//                   const dueDate = new Date(assignment.due_date);
//                   const today = new Date();
//                   const isPastDue = dueDate < today;
//                   const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
//                   return (
//                     <div key={assignment.assignment_id} className={`bg-gray-700 rounded-lg p-4 border ${
//                       isPastDue ? 'border-red-500/50' : 'border-gray-600'
//                     }`}>
//                       <div className="flex items-center justify-between">
//                         <div className="flex-1">
//                           <h5 className="text-lg font-semibold text-white">{assignment.title}</h5>
//                           <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
//                             <span className="flex items-center gap-1">
//                               <Calendar className="w-4 h-4" />
//                               Due: {dueDate.toLocaleDateString()}
//                             </span>
//                             <span>Max: {assignment.max_points} points</span>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className={`flex items-center gap-2 ${
//                             isPastDue ? 'text-red-400' : 'text-orange-400'
//                           }`}>
//                             <XCircle className="w-6 h-6" />
//                             <div>
//                               <div className="text-sm font-medium">Not Submitted</div>
//                               {isPastDue ? (
//                                 <div className="text-xs text-red-400">Past Due</div>
//                               ) : (
//                                 <div className="text-xs">
//                                   {daysUntilDue === 0 ? 'Due Today' : 
//                                    daysUntilDue === 1 ? 'Due Tomorrow' : 
//                                    `${daysUntilDue} days left`}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Assignment Breakdown */}
//       <div className="bg-gray-800 rounded-xl p-6">
//         <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//           <TrendingUp className="w-6 h-6 text-blue-400" />
//           Assignment Performance
//         </h3>

//         {assignments.length === 0 ? (
//           <div className="text-center py-8 text-gray-400">
//             <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
//               <BarChart3 className="w-8 h-8" />
//             </div>
//             <p className="text-lg">No assignments found for this course.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {assignments.map((assignment) => {
//               const submission = submissions[assignment.assignment_id];
//               const maxPoints = assignment.max_points || 0;
//               const percentage = submission && submission.points_earned !== null 
//                 ? (submission.points_earned / maxPoints) * 100 
//                 : 0;
              
//               return (
//                 <div key={assignment.assignment_id} className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex-1">
//                       <h4 className="text-lg font-semibold text-white mb-2">{assignment.title}</h4>
//                       <div className="flex items-center gap-4 text-sm text-gray-400">
//                         <span className="flex items-center gap-1">
//                           <Calendar className="w-4 h-4" />
//                           Due: {new Date(assignment.due_date).toLocaleDateString()}
//                         </span>
//                         <span className="flex items-center gap-1">
//                           <Target className="w-4 h-4" />
//                           Max: {maxPoints} points
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       {submission ? (
//                         submission.points_earned !== null ? (
//                           <div className="text-center">
//                             <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
//                               {submission.points_earned}/{maxPoints}
//                             </div>
//                             <div className={`text-sm font-medium ${getGradeColor(percentage)}`}>
//                               {percentage.toFixed(1)}%
//                             </div>
//                             <div className="text-xs text-gray-400 mt-1">Graded</div>
//                           </div>
//                         ) : (
//                           <div className="text-yellow-400 text-center">
//                             <Clock className="w-8 h-8 mx-auto mb-1" />
//                             <div className="text-sm font-medium">Submitted</div>
//                             <div className="text-xs text-gray-400">Pending Review</div>
//                           </div>
//                         )
//                       ) : (
//                         <div className="text-red-400 text-center">
//                           <XCircle className="w-8 h-8 mx-auto mb-1" />
//                           <div className="text-sm font-medium">Not Submitted</div>
//                           <div className="text-xs text-gray-400">Missing</div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Enhanced Progress Bar */}
//                   <div className="mb-4">
//                     <div className="flex justify-between text-xs text-gray-400 mb-1">
//                       <span>Progress</span>
//                       <span>{submission && submission.points_earned !== null ? `${percentage.toFixed(1)}%` : '0%'}</span>
//                     </div>
//                     <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
//                       <div 
//                         className={`h-3 rounded-full transition-all duration-500 ease-out ${
//                           percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
//                           percentage >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
//                           percentage >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
//                           percentage >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
//                           'bg-gradient-to-r from-red-500 to-red-400'
//                         }`}
//                         style={{ 
//                           width: `${submission && submission.points_earned !== null ? percentage : 0}%`,
//                           boxShadow: percentage > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
//                         }}
//                       ></div>
//                     </div>
//                   </div>

//                   {/* Feedback Section */}
//                   {submission && submission.feedback && (
//                     <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500 backdrop-blur-sm">
//                       <p className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
//                         <CheckCircle className="w-4 h-4" />
//                         Instructor Feedback:
//                       </p>
//                       <p className="text-sm text-gray-300 leading-relaxed">{submission.feedback}</p>
//                     </div>
//                   )}

//                   {/* Assignment Status Indicator */}
//                   <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
//                     <div className="flex items-center gap-2 text-xs text-gray-400">
//                       {submission ? (
//                         submission.points_earned !== null ? (
//                           <>
//                             <CheckCircle className="w-4 h-4 text-green-400" />
//                             <span>Completed & Graded</span>
//                           </>
//                         ) : (
//                           <>
//                             <Clock className="w-4 h-4 text-yellow-400" />
//                             <span>Awaiting Grade</span>
//                           </>
//                         )
//                       ) : (
//                         <>
//                           <AlertCircle className="w-4 h-4 text-red-400" />
//                           <span>Action Required</span>
//                         </>
//                       )}
//                     </div>
//                     {submission && submission.points_earned !== null && (
//                       <div className="text-xs text-gray-400">
//                         Grade: {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Progress;



// import { useState, useEffect } from 'react';
// import { BarChart3, TrendingUp, Calendar, CheckCircle, XCircle, Clock, Target, AlertCircle } from 'lucide-react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart, ComposedChart } from 'recharts';

// const Progress = ({ courseCode, courseId }) => {
//   const [assignments, setAssignments] = useState([]);
//   const [submissions, setSubmissions] = useState({});
//   const [courseStats, setCourseStats] = useState(null);
//   const [weeklyPerformance, setWeeklyPerformance] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Mock API function for demo purposes
//   const api = async (endpoint) => {
//     // Simulate API delay
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     // Mock data based on endpoint
//     if (endpoint.includes('assignments/course_code')) {
//       return [
//         { assignment_id: 1, title: 'Assignment 1: Basic Concepts', due_date: '2024-02-15', max_points: 100 },
//         { assignment_id: 2, title: 'Assignment 2: Advanced Topics', due_date: '2024-02-22', max_points: 150 },
//         { assignment_id: 3, title: 'Assignment 3: Research Paper', due_date: '2024-03-01', max_points: 200 },
//         { assignment_id: 4, title: 'Assignment 4: Final Project', due_date: '2024-03-15', max_points: 250 },
//         { assignment_id: 5, title: 'Assignment 5: Presentation', due_date: '2024-03-22', max_points: 100 }
//       ];
//     }
    
//     if (endpoint.includes('weekly-performance')) {
//       return {
//         weekly_performance: [
//           { week_number: 1, topic_title: 'Introduction to Web Development', actual_performance: 85, expected_performance: 90, performance_percentage: 94.4, graded_assignments: 2, total_assignments: 2 },
//           { week_number: 2, topic_title: 'HTML & CSS Fundamentals', actual_performance: 92, expected_performance: 95, performance_percentage: 96.8, graded_assignments: 1, total_assignments: 2 },
//           { week_number: 3, topic_title: 'JavaScript Basics', actual_performance: 78, expected_performance: 85, performance_percentage: 91.8, graded_assignments: 2, total_assignments: 2 },
//           { week_number: 4, topic_title: 'React Components', actual_performance: 88, expected_performance: 90, performance_percentage: 97.8, graded_assignments: 1, total_assignments: 1 },
//           { week_number: 5, topic_title: 'State Management', actual_performance: 95, expected_performance: 100, performance_percentage: 95.0, graded_assignments: 2, total_assignments: 2 },
//           { week_number: 6, topic_title: 'API Integration', actual_performance: 82, expected_performance: 88, performance_percentage: 93.2, graded_assignments: 1, total_assignments: 2 }
//         ]
//       };
//     }
    
//     if (endpoint.includes('submissions/student')) {
//       const submissionId = endpoint.split('/').pop();
//       const submissions = {
//         1: { points_earned: 85, feedback: 'Good work on the basic concepts. Need improvement in problem-solving approach.' },
//         2: { points_earned: 138, feedback: 'Excellent understanding of advanced topics. Well-structured solution.' },
//         3: { points_earned: 185, feedback: 'Comprehensive research with good analysis. Minor formatting issues.' },
//         4: { points_earned: null, feedback: null }, // Not graded yet
//         5: { points_earned: null, feedback: null }  // Not submitted
//       };
//       return submissions[submissionId] || null;
//     }
    
//     return null;
//   };

//   useEffect(() => {
//     const fetchProgress = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         // Fetch assignments
//         const assignmentsData = await api(`/assignments/course_code/${courseCode}`);
//         setAssignments(assignmentsData || []);
        
//         // Fetch weekly performance data
//         if (courseId) {
//           try {
//             const weeklyData = await api(`/weekly-performance/course/${courseId}`);
//             console.log('Weekly performance data:', weeklyData);
//             setWeeklyPerformance(weeklyData || null);
//           } catch (err) {
//             console.error('Error fetching weekly performance:', err);
//             setWeeklyPerformance(null);
//           }
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
//         console.error('Error fetching progress:', error);
//         setError('Failed to load course progress');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseCode) {
//       fetchProgress();
//     }
//   }, [courseCode, courseId]);

//   const calculateCourseStats = (assignmentsData, submissionsMap) => {
//     const totalAssignments = assignmentsData.length;
//     const submittedAssignments = Object.values(submissionsMap).filter(sub => sub !== null).length;
//     const gradedAssignments = Object.values(submissionsMap).filter(sub => sub && sub.points_earned !== null).length;
    
//     const pendingAssignments = assignmentsData.filter(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       return !submission || submission.points_earned === null;
//     }).length;
    
//     let totalPossiblePoints = 0;
//     let totalEarnedPoints = 0;
//     let totalGradedPossiblePoints = 0;
//     let totalWeightedScore = 0;
//     let totalWeight = 0;

//     assignmentsData.forEach(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       totalPossiblePoints += assignment.max_points || 0;
      
//       const assignmentDueDate = new Date(assignment.due_date);
//       const currentDate = new Date();
//       const isDeadlinePassed = assignmentDueDate < currentDate;
      
//       if (submission && submission.points_earned !== null) {
//         totalEarnedPoints += Number(submission.points_earned);
//         const weight = 1;
//         totalWeightedScore += (submission.points_earned / (assignment.max_points || 1)) * weight;
//         totalWeight += weight;
//       }
      
//       if ((submission && submission.points_earned !== null) || isDeadlinePassed) {
//         totalGradedPossiblePoints += Number(assignment.max_points || 0);
//       }
//     });

//     const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
//     const averageScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

//     setCourseStats({
//       totalAssignments,
//       submittedAssignments,
//       gradedAssignments,
//       pendingAssignments,
//       totalPossiblePoints,
//       totalGradedPossiblePoints,
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

//   const getPendingAssignments = () => {
//     return assignments.filter(assignment => {
//       const submission = submissions[assignment.assignment_id];
//       return !submission;
//     });
//   };

//   const getUpcomingDeadlines = () => {
//     const pendingAssignments = getPendingAssignments();
//     const today = new Date();
    
//     return pendingAssignments
//       .filter(assignment => new Date(assignment.due_date) >= today)
//       .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
//       .slice(0, 5);
//   };

//   // Enhanced Custom Tooltips
//   const WeeklyPerformanceTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
//           <p className="text-white font-semibold mb-2">{`Week ${label}: ${data.topic_title}`}</p>
//           <div className="space-y-1">
//             <p className="text-blue-400 flex items-center justify-between">
//               <span>Actual:</span>
//               <span className="font-medium">{data.actual_performance} pts</span>
//             </p>
//             <p className="text-green-400 flex items-center justify-between">
//               <span>Expected:</span>
//               <span className="font-medium">{data.expected_performance} pts</span>
//             </p>
//             <p className="text-purple-400 flex items-center justify-between">
//               <span>Performance:</span>
//               <span className="font-medium">{data.performance_percentage.toFixed(1)}%</span>
//             </p>
//             <p className="text-gray-400 flex items-center justify-between">
//               <span>Progress:</span>
//               <span className="font-medium">{data.graded_assignments}/{data.total_assignments}</span>
//             </p>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const PerformanceBarTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
//           <p className="text-white font-semibold mb-2">{`Week ${label}`}</p>
//           <p className="text-purple-400">{`Performance: ${data.performance_percentage.toFixed(1)}%`}</p>
//           <p className="text-gray-300 text-sm">{data.topic_title}</p>
//         </div>
//       );
//     }
//     return null;
//   };

//   // Process data for trend analysis
//   const getPerformanceTrendData = () => {
//     if (!weeklyPerformance?.weekly_performance) return [];
    
//     return weeklyPerformance.weekly_performance.map(week => ({
//       ...week,
//       efficiency: week.expected_performance > 0 ? (week.actual_performance / week.expected_performance) * 100 : 0,
//       completion_rate: week.total_assignments > 0 ? (week.graded_assignments / week.total_assignments) * 100 : 0
//     }));
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <div className="text-white text-lg">Loading course progress...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-16">
//         <div className="text-red-400 text-lg">Error: {error}</div>
//       </div>
//     );
//   }

//   const trendData = getPerformanceTrendData();

//   return (
//     <div className="space-y-8">
//       {/* Current Progress Summary */}
//       {courseStats && (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-blue-300 text-sm font-medium">Total Points</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.totalEarnedPoints}
//                 </p>
//                 <p className="text-blue-400 text-sm">
//                   out of {courseStats.totalGradedPossiblePoints} 
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

//           <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-green-300 text-sm font-medium">Graded Assignments</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.gradedAssignments}
//                 </p>
//                 <p className="text-green-400 text-sm">
//                   assignments graded
//                 </p>
//               </div>
//               <CheckCircle className="w-12 h-12 text-green-400 opacity-80" />
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-500/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-red-300 text-sm font-medium">Pending Assignments</p>
//                 <p className="text-3xl font-bold text-white">
//                   {courseStats.pendingAssignments}
//                 </p>
//                 <p className="text-red-400 text-sm">
//                   assignments pending
//                 </p>
//               </div>
//               <AlertCircle className="w-12 h-12 text-red-400 opacity-80" />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Weekly Performance Analysis */}
//       {weeklyPerformance && weeklyPerformance.weekly_performance && weeklyPerformance.weekly_performance.length > 0 ? (
//         <div className="bg-gray-800 rounded-xl p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h3 className="text-xl font-semibold text-white flex items-center gap-2">
//               <TrendingUp className="w-6 h-6 text-blue-400" />
//               Performance Analytics
//             </h3>
//             <div className="flex gap-3 text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 bg-blue-500 rounded"></div>
//                 <span className="text-gray-300">Actual</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 bg-green-500 rounded border-2 border-green-500" style={{background: 'transparent'}}></div>
//                 <span className="text-gray-300">Expected</span>
//               </div>
//             </div>
//           </div>
          
//           {/* Main Performance Trend Chart */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//             <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//               <h4 className="text-lg font-semibold text-white mb-4">Performance Trend Over Time</h4>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
//                         <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
//                     <XAxis 
//                       dataKey="week_number" 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                     />
//                     <YAxis 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                     />
//                     <Tooltip content={<WeeklyPerformanceTooltip />} />
//                     <Area
//                       type="monotone"
//                       dataKey="actual_performance"
//                       stroke="#3B82F6"
//                       strokeWidth={3}
//                       fill="url(#actualGradient)"
//                       name="Actual Performance"
//                     />
//                     <Line 
//                       type="monotone" 
//                       dataKey="expected_performance" 
//                       stroke="#10B981" 
//                       strokeWidth={2}
//                       strokeDasharray="5 5"
//                       name="Expected Performance"
//                       dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
//                     />
//                   </ComposedChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//               <h4 className="text-lg font-semibold text-white mb-4">Weekly Performance Distribution</h4>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                     <defs>
//                       <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
//                         <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
//                     <XAxis 
//                       dataKey="week_number" 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                     />
//                     <YAxis 
//                       stroke="#9CA3AF"
//                       tick={{ fill: '#9CA3AF', fontSize: 12 }}
//                       tickLine={{ stroke: '#9CA3AF' }}
//                     />
//                     <Tooltip content={<PerformanceBarTooltip />} />
//                     <Bar 
//                       dataKey="performance_percentage" 
//                       name="Performance %"
//                       fill="url(#barGradient)"
//                       radius={[4, 4, 0, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           {/* Weekly Topics Summary with Enhanced Styling */}
//           <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
//             <h4 className="text-lg font-semibold text-white mb-6">Weekly Topics Overview</h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {trendData.map((week) => {
//                 const performancePercentage = Number(week.performance_percentage) || 0;
//                 const earnedPoints = Number(week.actual_performance || week.total_earned_points) || 0;
//                 const possiblePoints = Number(week.expected_performance || week.total_possible_points) || 0;
//                 const gradedAssignments = Number(week.graded_assignments) || 0;
//                 const totalAssignments = Number(week.total_assignments) || 0;
                
//                 return (
//                   <div key={week.week_number} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
//                     <div className="flex justify-between items-start mb-3">
//                       <h5 className="font-semibold text-white">Week {week.week_number}</h5>
//                       <span className={`text-sm font-bold px-2 py-1 rounded ${getGradeColor(performancePercentage)}`}>
//                         {performancePercentage.toFixed(1)}%
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-300 mb-3 line-clamp-2">{week.topic_title}</p>
//                     <div className="space-y-2">
//                       <div className="flex justify-between text-xs text-gray-400">
//                         <span>Points:</span>
//                         <span className="text-white">{earnedPoints}/{possiblePoints}</span>
//                       </div>
//                       <div className="flex justify-between text-xs text-gray-400">
//                         <span>Assignments:</span>
//                         <span className="text-white">{gradedAssignments}/{totalAssignments}</span>
//                       </div>
//                       <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
//                         <div 
//                           className={`h-2 rounded-full transition-all duration-300 ${
//                             performancePercentage >= 90 ? 'bg-green-500' :
//                             performancePercentage >= 80 ? 'bg-blue-500' :
//                             performancePercentage >= 70 ? 'bg-yellow-500' :
//                             performancePercentage >= 60 ? 'bg-orange-500' :
//                             'bg-red-500'
//                           }`}
//                           style={{ width: `${Math.min(100, Math.max(0, performancePercentage))}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="bg-gray-800 rounded-xl p-6">
//           <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//             <Calendar className="w-6 h-6 text-purple-400" />
//             Weekly Performance Analysis
//           </h3>
//           <div className="text-center py-8 text-gray-400">
//             <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
//             <p className="text-lg">No weekly performance data available yet.</p>
//             <p className="text-sm">Weekly data will appear as assignments are completed and graded.</p>
//           </div>
//         </div>
//       )}

//       {/* Pending Assignments Section */}
//       <div className="bg-gray-800 rounded-xl p-6">
//         <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//           <AlertCircle className="w-6 h-6 text-red-400" />
//           Pending Assignments
//         </h3>

//         {getPendingAssignments().length === 0 ? (
//           <div className="text-center py-8 text-gray-400">
//             <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
//             <p className="text-lg">Great job! All assignments have been submitted.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {getUpcomingDeadlines().length > 0 && (
//               <div className="mb-6">
//                 <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
//                   <Clock className="w-5 h-5 text-yellow-400" />
//                   Upcoming Deadlines
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {getUpcomingDeadlines().map((assignment) => {
//                     const dueDate = new Date(assignment.due_date);
//                     const today = new Date();
//                     const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
//                     return (
//                       <div key={assignment.assignment_id} className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
//                         <h5 className="font-semibold text-white mb-2">{assignment.title}</h5>
//                         <div className="text-sm text-yellow-300">
//                           <p className="flex items-center gap-1 mb-1">
//                             <Calendar className="w-4 h-4" />
//                             Due: {dueDate.toLocaleDateString()}
//                           </p>
//                           <p className={`font-medium ${
//                             daysUntilDue <= 1 ? 'text-red-400' : 
//                             daysUntilDue <= 3 ? 'text-orange-400' : 'text-yellow-400'
//                           }`}>
//                             {daysUntilDue === 0 ? 'Due Today!' : 
//                              daysUntilDue === 1 ? 'Due Tomorrow' : 
//                              `${daysUntilDue} days remaining`}
//                           </p>
//                           <p className="text-gray-400">Max: {assignment.max_points} points</p>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             <div>
//               <h4 className="text-lg font-semibold text-white mb-4">All Pending Assignments</h4>
//               <div className="space-y-3">
//                 {getPendingAssignments().map((assignment) => {
//                   const dueDate = new Date(assignment.due_date);
//                   const today = new Date();
//                   const isPastDue = dueDate < today;
//                   const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
//                   return (
//                     <div key={assignment.assignment_id} className={`bg-gray-700 rounded-lg p-4 border ${
//                       isPastDue ? 'border-red-500/50' : 'border-gray-600'
//                     }`}>
//                       <div className="flex items-center justify-between">
//                         <div className="flex-1">
//                           <h5 className="text-lg font-semibold text-white">{assignment.title}</h5>
//                           <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
//                             <span className="flex items-center gap-1">
//                               <Calendar className="w-4 h-4" />
//                               Due: {dueDate.toLocaleDateString()}
//                             </span>
//                             <span>Max: {assignment.max_points} points</span>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className={`flex items-center gap-2 ${
//                             isPastDue ? 'text-red-400' : 'text-orange-400'
//                           }`}>
//                             <XCircle className="w-6 h-6" />
//                             <div>
//                               <div className="text-sm font-medium">Not Submitted</div>
//                               {isPastDue ? (
//                                 <div className="text-xs text-red-400">Past Due</div>
//                               ) : (
//                                 <div className="text-xs">
//                                   {daysUntilDue === 0 ? 'Due Today' : 
//                                    daysUntilDue === 1 ? 'Due Tomorrow' : 
//                                    `${daysUntilDue} days left`}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Assignment Breakdown */}
//       <div className="bg-gray-800 rounded-xl p-6">
//         <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
//           <TrendingUp className="w-6 h-6 text-blue-400" />
//           Assignment Performance
//         </h3>

//         {assignments.length === 0 ? (
//           <div className="text-center py-8 text-gray-400">
//             <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
//               <BarChart3 className="w-8 h-8" />
//             </div>
//             <p className="text-lg">No assignments found for this course.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {assignments.map((assignment) => {
//               const submission = submissions[assignment.assignment_id];
//               const maxPoints = assignment.max_points || 0;
//               const percentage = submission && submission.points_earned !== null 
//                 ? (submission.points_earned / maxPoints) * 100 
//                 : 0;
              
//               return (
//                 <div key={assignment.assignment_id} className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex-1">
//                       <h4 className="text-lg font-semibold text-white mb-2">{assignment.title}</h4>
//                       <div className="flex items-center gap-4 text-sm text-gray-400">
//                         <span className="flex items-center gap-1">
//                           <Calendar className="w-4 h-4" />
//                           Due: {new Date(assignment.due_date).toLocaleDateString()}
//                         </span>
//                         <span className="flex items-center gap-1">
//                           <Target className="w-4 h-4" />
//                           Max: {maxPoints} points
//                         </span>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       {submission ? (
//                         submission.points_earned !== null ? (
//                           <div className="text-center">
//                             <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
//                               {submission.points_earned}/{maxPoints}
//                             </div>
//                             <div className={`text-sm font-medium ${getGradeColor(percentage)}`}>
//                               {percentage.toFixed(1)}%
//                             </div>
//                             <div className="text-xs text-gray-400 mt-1">Graded</div>
//                           </div>
//                         ) : (
//                           <div className="text-yellow-400 text-center">
//                             <Clock className="w-8 h-8 mx-auto mb-1" />
//                             <div className="text-sm font-medium">Submitted</div>
//                             <div className="text-xs text-gray-400">Pending Review</div>
//                           </div>
//                         )
//                       ) : (
//                         <div className="text-red-400 text-center">
//                           <XCircle className="w-8 h-8 mx-auto mb-1" />
//                           <div className="text-sm font-medium">Not Submitted</div>
//                           <div className="text-xs text-gray-400">Missing</div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Enhanced Progress Bar */}
//                   <div className="mb-4">
//                     <div className="flex justify-between text-xs text-gray-400 mb-1">
//                       <span>Progress</span>
//                       <span>{submission && submission.points_earned !== null ? `${percentage.toFixed(1)}%` : '0%'}</span>
//                     </div>
//                     <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
//                       <div 
//                         className={`h-3 rounded-full transition-all duration-500 ease-out ${
//                           percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
//                           percentage >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
//                           percentage >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
//                           percentage >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
//                           'bg-gradient-to-r from-red-500 to-red-400'
//                         }`}
//                         style={{ 
//                           width: `${submission && submission.points_earned !== null ? percentage : 0}%`,
//                           boxShadow: percentage > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
//                         }}
//                       ></div>
//                     </div>
//                   </div>

//                   {/* Feedback Section */}
//                   {submission && submission.feedback && (
//                     <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500 backdrop-blur-sm">
//                       <p className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
//                         <CheckCircle className="w-4 h-4" />
//                         Instructor Feedback:
//                       </p>
//                       <p className="text-sm text-gray-300 leading-relaxed">{submission.feedback}</p>
//                     </div>
//                   )}

//                   {/* Assignment Status Indicator */}
//                   <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
//                     <div className="flex items-center gap-2 text-xs text-gray-400">
//                       {submission ? (
//                         submission.points_earned !== null ? (
//                           <>
//                             <CheckCircle className="w-4 h-4 text-green-400" />
//                             <span>Completed & Graded</span>
//                           </>
//                         ) : (
//                           <>
//                             <Clock className="w-4 h-4 text-yellow-400" />
//                             <span>Awaiting Grade</span>
//                           </>
//                         )
//                       ) : (
//                         <>
//                           <AlertCircle className="w-4 h-4 text-red-400" />
//                           <span>Action Required</span>
//                         </>
//                       )}
//                     </div>
//                     {submission && submission.points_earned !== null && (
//                       <div className="text-xs text-gray-400">
//                         Grade: {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Progress;



import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../../utils/api';
import { BarChart3, TrendingUp, Calendar, CheckCircle, XCircle, Clock, Target, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart, ComposedChart, PieChart, Pie, Cell } from 'recharts';

const Progress = ({ courseCode, courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [courseStats, setCourseStats] = useState(null);
  const [weeklyPerformance, setWeeklyPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utility function for safe number conversion
  const safeNumber = useCallback((value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : Math.max(0, num);
  }, []);

  // Utility function for safe date parsing
  const safeDate = useCallback((dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }, []);

  // Validate API response structure
  const validateAssignmentsData = useCallback((data) => {
    if (!Array.isArray(data)) return [];
    return data.filter(assignment => 
      assignment && 
      assignment.assignment_id && 
      assignment.title && 
      assignment.due_date
    ).map(assignment => ({
      ...assignment,
      max_points: safeNumber(assignment.max_points),
      assignment_id: String(assignment.assignment_id)
    }));
  }, [safeNumber]);

  const validateWeeklyData = useCallback((data) => {
    if (!data || !Array.isArray(data.weekly_performance)) {
      return null;
    }
    
    const validWeeks = data.weekly_performance
      .filter(week => week && typeof week.week_number !== 'undefined')
      .map(week => ({
        ...week,
        week_number: safeNumber(week.week_number, 1),
        total_earned_points: safeNumber(week.total_earned_points),
        total_possible_points: safeNumber(week.total_possible_points),
        performance_percentage: safeNumber(week.performance_percentage),
        graded_assignments: safeNumber(week.graded_assignments),
        total_assignments: safeNumber(week.total_assignments),
        topic_title: week.topic_title || `Week ${week.week_number || 1}`
      }))
      .sort((a, b) => a.week_number - b.week_number);

    return {
      ...data,
      weekly_performance: validWeeks
    };
  }, [safeNumber]);

  const validateSubmissionData = useCallback((data) => {
    if (!data) return null;
    return {
      ...data,
      points_earned: data.points_earned !== null ? safeNumber(data.points_earned) : null,
      feedback: data.feedback || null
    };
  }, [safeNumber]);

  useEffect(() => {
    let isMounted = true; // Cleanup flag for component unmounting

    const fetchProgress = async () => {
      if (!courseCode) {
        setError('Course code is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching progress for course: ${courseCode}, courseId: ${courseId}`);
        
        // Fetch assignments with proper error handling
        let assignmentsData = [];
        try {
          const rawAssignments = await api(`/assignments/course_code/${courseCode}`);
          assignmentsData = validateAssignmentsData(rawAssignments);
          console.log('Validated assignments data:', assignmentsData);
          
          if (isMounted) {
            setAssignments(assignmentsData);
          }
        } catch (err) {
          console.error('Error fetching assignments:', err);
          if (isMounted) {
            setAssignments([]);
          }
        }
        
        // Fetch weekly performance data with proper validation
        if (courseId && isMounted) {
          try {
            const rawWeeklyData = await api(`/weekly-performance/course/${courseId}`);
            console.log('Raw weekly performance data:', rawWeeklyData);
            
            // Log detailed structure
            if (rawWeeklyData && rawWeeklyData.weekly_performance) {
              console.log('Weekly performance array length:', rawWeeklyData.weekly_performance.length);
              rawWeeklyData.weekly_performance.forEach((week, index) => {
                console.log(`Week ${index + 1} raw data:`, {
                  week_number: week.week_number,
                  total_assignments: week.total_assignments,
                  graded_assignments: week.graded_assignments,
                  total_possible_points: week.total_possible_points,
                  total_earned_points: week.total_earned_points,
                  performance_percentage: week.performance_percentage,
                  assignments: week.assignments?.length || 0
                });
              });
            }
            
            const validatedWeeklyData = validateWeeklyData(rawWeeklyData);
            console.log('Validated weekly performance data:', validatedWeeklyData);
            
            if (isMounted) {
              setWeeklyPerformance(validatedWeeklyData);
            }
          } catch (err) {
            console.error('Error fetching weekly performance:', err);
            if (isMounted) {
              // For debugging: create sample data if no data exists
              console.log('Creating sample weekly performance data for debugging...');
              const sampleData = {
                course_info: {
                  course_id: courseId,
                  course_name: 'Sample Course',
                  total_possible_points: 200,
                  total_earned_points: 150,
                  overall_performance_percentage: 75
                },
                weekly_performance: [
                  {
                    week_number: 1,
                    topic_title: 'Week 1: Introduction',
                    total_assignments: 2,
                    graded_assignments: 2,
                    total_possible_points: 50,
                    total_earned_points: 45,
                    performance_percentage: 90
                  },
                  {
                    week_number: 2,
                    topic_title: 'Week 2: Advanced Topics',
                    total_assignments: 3,
                    graded_assignments: 2,
                    total_possible_points: 75,
                    total_earned_points: 60,
                    performance_percentage: 80
                  },
                  {
                    week_number: 3,
                    topic_title: 'Week 3: Project Work',
                    total_assignments: 2,
                    graded_assignments: 1,
                    total_possible_points: 75,
                    total_earned_points: 45,
                    performance_percentage: 60
                  }
                ]
              };
              setWeeklyPerformance(sampleData);
            }
          }
        }
        
        // Fetch submissions for each assignment with batch processing
        if (assignmentsData.length > 0 && isMounted) {
          try {
            const submissionPromises = assignmentsData.map(async (assignment) => {
              try {
                const rawSubmission = await api(`/submissions/student/${assignment.assignment_id}`);
                const validatedSubmission = validateSubmissionData(rawSubmission);
                return { 
                  assignmentId: assignment.assignment_id, 
                  submission: validatedSubmission 
                };
              } catch (err) {
                console.warn(`Failed to fetch submission for assignment ${assignment.assignment_id}:`, err);
                return { 
                  assignmentId: assignment.assignment_id, 
                  submission: null 
                };
              }
            });
            
            const submissionResults = await Promise.all(submissionPromises);
            console.log('Submission results:', submissionResults);
            
            if (isMounted) {
              const submissionsMap = {};
              submissionResults.forEach(({ assignmentId, submission }) => {
                submissionsMap[assignmentId] = submission;
              });
              setSubmissions(submissionsMap);
              
              // Calculate course statistics with validated data
              calculateCourseStats(assignmentsData, submissionsMap);
            }
          } catch (err) {
            console.error('Error processing submissions:', err);
            if (isMounted) {
              setSubmissions({});
            }
          }
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
        if (isMounted) {
          setError(`Failed to load course progress: ${error.message || 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProgress();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [courseCode, courseId, validateAssignmentsData, validateWeeklyData, validateSubmissionData]);

  const calculateCourseStats = useCallback((assignmentsData, submissionsMap) => {
    try {
      if (!Array.isArray(assignmentsData) || !submissionsMap) {
        console.warn('Invalid data for course stats calculation');
        return;
      }

      const totalAssignments = assignmentsData.length;
      const submittedAssignments = Object.values(submissionsMap).filter(sub => sub !== null).length;
      const gradedAssignments = Object.values(submissionsMap).filter(sub => 
        sub && sub.points_earned !== null && sub.points_earned !== undefined
      ).length;
      
      const pendingAssignments = assignmentsData.filter(assignment => {
        const submission = submissionsMap[assignment.assignment_id];
        // Only count assignments that have NOT been submitted at all
        return !submission;
      }).length;
      
      let totalPossiblePoints = 0;
      let totalEarnedPoints = 0;
      let totalGradedPossiblePoints = 0;
      let totalWeightedScore = 0;
      let totalWeight = 0;

      assignmentsData.forEach(assignment => {
        const submission = submissionsMap[assignment.assignment_id];
        const maxPoints = safeNumber(assignment.max_points);
        totalPossiblePoints += maxPoints;
        
        // Check if deadline has passed for more accurate graded possible points
        const assignmentDueDate = safeDate(assignment.due_date);
        const currentDate = new Date();
        const isDeadlinePassed = assignmentDueDate ? assignmentDueDate < currentDate : false;
        
        if (submission && submission.points_earned !== null) {
          const earnedPoints = safeNumber(submission.points_earned);
          totalEarnedPoints += earnedPoints;
          
          if (maxPoints > 0) {
            const weight = 1; // Could be made configurable per assignment
            totalWeightedScore += (earnedPoints / maxPoints) * weight;
            totalWeight += weight;
          }
        }
        
        // Include in graded possible points if graded OR deadline passed
        if ((submission && submission.points_earned !== null) || isDeadlinePassed) {
          totalGradedPossiblePoints += maxPoints;
        }
      });

      // Calculate percentages with safe division
      const overallPercentage = totalPossiblePoints > 0 ? 
        Math.min(100, Math.max(0, (totalEarnedPoints / totalPossiblePoints) * 100)) : 0;
      
      const averageScore = totalWeight > 0 ? 
        Math.min(100, Math.max(0, (totalWeightedScore / totalWeight) * 100)) : 0;
      
      const completionRate = totalAssignments > 0 ? 
        Math.min(100, Math.max(0, (submittedAssignments / totalAssignments) * 100)) : 0;

      const stats = {
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        pendingAssignments,
        totalPossiblePoints: Math.round(totalPossiblePoints * 100) / 100,
        totalGradedPossiblePoints: Math.round(totalGradedPossiblePoints * 100) / 100,
        totalEarnedPoints: Math.round(totalEarnedPoints * 100) / 100,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100
      };

      console.log('Calculated course stats:', stats);
      setCourseStats(stats);
    } catch (error) {
      console.error('Error calculating course stats:', error);
      setCourseStats(null);
    }
  }, [safeNumber, safeDate]);

  // Calculate assignment status data for pie chart
  const getAssignmentStatusData = useMemo(() => {
    if (!assignments.length) return [];

    const today = new Date();
    let submitted = 0;
    let due = 0;
    let overdue = 0;

    assignments.forEach(assignment => {
      const submission = submissions[assignment.assignment_id];
      const dueDate = safeDate(assignment.due_date);
      
      if (submission) {
        // Assignment has been submitted
        submitted++;
      } else if (dueDate) {
        if (dueDate < today) {
          // Assignment is overdue
          overdue++;
        } else {
          // Assignment is due but not submitted
          due++;
        }
      } else {
        // No due date, consider as due
        due++;
      }
    });

    return [
      { name: 'Submitted', value: submitted, color: '#10B981' },
      { name: 'Due', value: due, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' }
    ].filter(item => item.value > 0); // Only show categories with values > 0
  }, [assignments, submissions, safeDate]);

  // Custom tooltip for pie chart
  const PieTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900 border border-gray-600 p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-300">{data.value} assignment{data.value !== 1 ? 's' : ''}</p>
          <p className="text-gray-400 text-sm">
            {assignments.length > 0 ? `${((data.value / assignments.length) * 100).toFixed(1)}%` : '0%'} of total
          </p>
        </div>
      );
    }
    return null;
  }, [assignments.length]);

  // Memoized helper functions
  const getGradeColor = useCallback((percentage) => {
    const safePercentage = safeNumber(percentage);
    if (safePercentage >= 90) return 'text-green-400';
    if (safePercentage >= 80) return 'text-blue-400';
    if (safePercentage >= 70) return 'text-yellow-400';
    if (safePercentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  }, [safeNumber]);

  const getPendingAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const submission = submissions[assignment.assignment_id];
      // Only show assignments that have NOT been submitted at all
      return !submission;
    });
  }, [assignments, submissions]);

  const getUpcomingDeadlines = useMemo(() => {
    const today = new Date();
    
    return getPendingAssignments
      .filter(assignment => {
        const dueDate = safeDate(assignment.due_date);
        return dueDate && dueDate >= today;
      })
      .sort((a, b) => {
        const dateA = safeDate(a.due_date);
        const dateB = safeDate(b.due_date);
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [getPendingAssignments, safeDate]);

  // Enhanced tooltip components with error boundaries
  const WeeklyPointsTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length || !payload[0] || !payload[0].payload) {
      return null;
    }

    try {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">
            {`Week ${safeNumber(label, 1)}: ${data.topic_title || `Week ${label}`}`}
          </p>
          <div className="space-y-1">
            <p className="text-blue-400 flex items-center justify-between">
              <span>Earned Points:</span>
              <span className="font-medium">{safeNumber(data.total_earned_points).toFixed(1)} pts</span>
            </p>
            <p className="text-green-400 flex items-center justify-between">
              <span>Total Possible:</span>
              <span className="font-medium">{safeNumber(data.total_possible_points).toFixed(1)} pts</span>
            </p>
            <p className="text-purple-400 flex items-center justify-between">
              <span>Performance:</span>
              <span className="font-medium">{safeNumber(data.performance_percentage).toFixed(1)}%</span>
            </p>
            <p className="text-gray-400 flex items-center justify-between">
              <span>Assignments:</span>
              <span className="font-medium">
                {safeNumber(data.graded_assignments)}/{safeNumber(data.total_assignments)}
              </span>
            </p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering WeeklyPointsTooltip:', error);
      return null;
    }
  }, [safeNumber]);

  const PerformanceBarTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length || !payload[0] || !payload[0].payload) {
      return null;
    }

    try {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-600 p-4 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{`Week ${safeNumber(label, 1)}`}</p>
          <p className="text-purple-400">
            Performance: {safeNumber(data.performance_percentage).toFixed(1)}%
          </p>
          <p className="text-gray-300 text-sm">
            {data.topic_title || `Week ${label} Content`}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {safeNumber(data.total_earned_points).toFixed(1)}/{safeNumber(data.total_possible_points).toFixed(1)} points
          </p>
        </div>
      );
    } catch (error) {
      console.error('Error rendering PerformanceBarTooltip:', error);
      return null;
    }
  }, [safeNumber]);

  // Optimized data processing with comprehensive validation
  const getPerformanceTrendData = useMemo(() => {
    if (!weeklyPerformance?.weekly_performance || !Array.isArray(weeklyPerformance.weekly_performance)) {
      console.log('No valid weekly performance data available for charts');
      return [];
    }
    
    console.log('Processing weekly performance data for charts:', weeklyPerformance.weekly_performance);
    
    try {
      const processedData = weeklyPerformance.weekly_performance
        .filter(week => {
          // More strict validation
          return week && 
                 typeof week.week_number !== 'undefined' && 
                 week.week_number !== null &&
                 !isNaN(week.week_number);
        })
        .map((week, index) => {
          // Comprehensive data validation and processing
          const earnedPoints = safeNumber(week.total_earned_points);
          const possiblePoints = safeNumber(week.total_possible_points);
          const gradedAssignments = safeNumber(week.graded_assignments);
          const totalAssignments = safeNumber(week.total_assignments);
          
          console.log(`Week ${week.week_number} raw values:`, {
            total_earned_points: week.total_earned_points,
            total_possible_points: week.total_possible_points,
            graded_assignments: week.graded_assignments,
            total_assignments: week.total_assignments,
            performance_percentage: week.performance_percentage
          });
          
          console.log(`Week ${week.week_number} safe values:`, {
            earnedPoints,
            possiblePoints,
            gradedAssignments,
            totalAssignments
          });
          
          // Calculate performance percentage with proper edge case handling
          let performancePercentage = 0;
          if (possiblePoints > 0) {
            performancePercentage = Math.min(100, Math.max(0, (earnedPoints / possiblePoints) * 100));
          } else if (totalAssignments === 0) {
            // No assignments this week, consider it 100% (no penalty)
            performancePercentage = 100;
          }
          
          console.log(`Week ${week.week_number} calculated performance:`, performancePercentage);
          
          // Calculate submission rate
          let submissionRate = 0;
          if (totalAssignments > 0) {
            submissionRate = Math.min(100, Math.max(0, (gradedAssignments / totalAssignments) * 100));
          } else {
            submissionRate = 100; // No assignments to submit
          }
        
          const result = {
            week_number: safeNumber(week.week_number, index + 1),
            topic_title: week.topic_title || `Week ${week.week_number || (index + 1)}`,
            total_earned_points: Math.round(earnedPoints * 100) / 100,
            total_possible_points: Math.round(possiblePoints * 100) / 100,
            performance_percentage: Math.round(performancePercentage * 100) / 100,
            graded_assignments: gradedAssignments,
            total_assignments: totalAssignments,
            submission_rate: Math.round(submissionRate * 100) / 100,
            // Additional calculated fields for enhanced analytics
            efficiency_score: possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 10000) / 100 : 0,
            completion_status: totalAssignments > 0 ? 
              (gradedAssignments === totalAssignments ? 'complete' : 'partial') : 'none'
          };
          
          console.log(`Week ${result.week_number} processed:`, result);
          return result;
        })
        .sort((a, b) => a.week_number - b.week_number); // Ensure proper sorting
      
      console.log('Final processed chart data:', processedData);
      return processedData;
    } catch (error) {
      console.error('Error processing trend data:', error);
      return [];
    }
  }, [weeklyPerformance, safeNumber]);

  // Loading state with better UX
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading course progress...</div>
          <div className="text-gray-400 text-sm mt-2">
            Fetching assignments, submissions, and performance data
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with retry option
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <div className="text-red-400 text-lg mb-2">Failed to Load Progress</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const trendData = getPerformanceTrendData;
  console.log('Chart will render with data:', trendData);

  return (
    <div className="space-y-8">
      {/* Current Progress Summary with better data validation */}
      {courseStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold text-white">
                  {safeNumber(courseStats.totalEarnedPoints).toFixed(1)}
                </p>
                <p className="text-blue-400 text-sm">
                  out of {safeNumber(courseStats.totalGradedPossiblePoints).toFixed(1)} 
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
                  {safeNumber(courseStats.completionRate).toFixed(0)}%
                </p>
                <p className="text-purple-400 text-sm">
                  {safeNumber(courseStats.submittedAssignments)}/{safeNumber(courseStats.totalAssignments)} submitted
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-400 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Graded Assignments</p>
                <p className="text-3xl font-bold text-white">
                  {safeNumber(courseStats.gradedAssignments)}
                </p>
                <p className="text-green-400 text-sm">
                  assignments graded
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm font-medium">Unsubmitted</p>
                <p className="text-3xl font-bold text-white">
                  {safeNumber(courseStats.pendingAssignments)}
                </p>
                <p className="text-red-400 text-sm">
                  assignments not submitted
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-400 opacity-80" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Course statistics will appear here</p>
            <p className="text-sm">Loading assignment and submission data...</p>
          </div>
        </div>
      )}

      {/* Assignment Status Pie Chart */}
      {assignments.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Assignment Status Overview
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Pie Chart */}
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getAssignmentStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="#374151"
                      strokeWidth={2}
                    >
                      {getAssignmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontWeight: 'bold' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Cards */}
            <div className="space-y-4">
              {getAssignmentStatusData.map((item, index) => {
                const percentage = assignments.length > 0 ? (item.value / assignments.length) * 100 : 0;
                return (
                  <div 
                    key={item.name} 
                    className="bg-gray-700 rounded-lg p-4 border-l-4 hover:bg-gray-600 transition-colors duration-300"
                    style={{ borderLeftColor: item.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                          <p className="text-sm text-gray-400">
                            {item.name === 'Submitted' && 'Completed assignments'}
                            {item.name === 'Due' && 'Pending assignments'}
                            {item.name === 'Overdue' && 'Past due assignments'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{item.value}</div>
                        <div className="text-sm text-gray-400">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    {/* Progress bar for visual representation */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Total Summary */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Total Assignments</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{assignments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Weekly Performance Analysis */}
      {weeklyPerformance && weeklyPerformance.weekly_performance && weeklyPerformance.weekly_performance.length > 0 && trendData.length > 0 ? (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Performance Analytics
            </h3>
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-300">Earned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span className="text-gray-300">Possible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded border-2 border-green-500" style={{background: 'transparent'}}></div>
                <span className="text-gray-300">Target</span>
              </div>
            </div>
          </div>
          
          {/* Main Performance Trend Chart - Total vs Earned Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Weekly Points Progress</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="earnedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="week_number" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />
                    <Tooltip content={<WeeklyPointsTooltip />} />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Bar
                      dataKey="total_possible_points"
                      fill="#374151"
                      name="Total Possible Points"
                      radius={[4, 4, 0, 0]}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_earned_points"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#earnedGradient)"
                      name="Earned Points"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_possible_points" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target Points"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Weekly Performance Percentage</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="week_number" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      label={{ value: 'Week', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickLine={{ stroke: '#9CA3AF' }}
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                    />
                    <Tooltip content={<PerformanceBarTooltip />} />
                    <Bar 
                      dataKey="performance_percentage" 
                      name="Performance %"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly Topics Summary with Enhanced Styling */}
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-6">Weekly Topics Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyPerformance.weekly_performance.map((week) => {
                const performancePercentage = safeNumber(week.performance_percentage);
                const earnedPoints = safeNumber(week.total_earned_points);
                const possiblePoints = safeNumber(week.total_possible_points);
                const gradedAssignments = safeNumber(week.graded_assignments);
                const totalAssignments = safeNumber(week.total_assignments);
                
                return (
                  <div key={week.week_number} className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-semibold text-white">Week {safeNumber(week.week_number, 1)}</h5>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${getGradeColor(performancePercentage)}`}>
                        {performancePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{week.topic_title || `Week ${week.week_number}`}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Points:</span>
                        <span className="text-white">{earnedPoints.toFixed(1)}/{possiblePoints.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Assignments:</span>
                        <span className="text-white">{gradedAssignments}/{totalAssignments}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            performancePercentage >= 90 ? 'bg-green-500' :
                            performancePercentage >= 80 ? 'bg-blue-500' :
                            performancePercentage >= 70 ? 'bg-yellow-500' :
                            performancePercentage >= 60 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, performancePercentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Weekly Performance Analysis
          </h3>
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No weekly performance data available yet.</p>
            <p className="text-sm">Weekly data will appear as assignments are completed and graded.</p>
            {weeklyPerformance && (
              <p className="text-xs mt-2 text-red-400">
                Debug: {JSON.stringify(weeklyPerformance, null, 2)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pending Assignments Section with improved data handling */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            Unsubmitted Assignments
          </h3>
          <p className="text-sm text-gray-400">
            Assignments that haven't been submitted yet (including overdue assignments)
          </p>
        </div>

        {getPendingAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p className="text-lg">Great job! All assignments have been submitted.</p>
            <p className="text-sm mt-2">
              {assignments.length > 0 ? 
                `All ${assignments.length} assignments are submitted or graded` : 
                'No assignments found for this course'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getUpcomingDeadlines.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Upcoming Deadlines
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getUpcomingDeadlines.map((assignment) => {
                    const dueDate = safeDate(assignment.due_date);
                    if (!dueDate) return null;
                    
                    const today = new Date();
                    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={assignment.assignment_id} className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-2">{assignment.title}</h5>
                        <div className="text-sm text-yellow-300">
                          <p className="flex items-center gap-1 mb-1">
                            <Calendar className="w-4 h-4" />
                            Due: {dueDate.toLocaleDateString()}
                          </p>
                          <p className={`font-medium ${
                            daysUntilDue <= 1 ? 'text-red-400' : 
                            daysUntilDue <= 3 ? 'text-orange-400' : 'text-yellow-400'
                          }`}>
                            {daysUntilDue === 0 ? 'Due Today!' : 
                             daysUntilDue === 1 ? 'Due Tomorrow' : 
                             `${daysUntilDue} days remaining`}
                          </p>
                          <p className="text-gray-400">Max: {safeNumber(assignment.max_points)} points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">All Unsubmitted Assignments</h4>
              <div className="space-y-3">
                {getPendingAssignments.map((assignment) => {
                  const dueDate = safeDate(assignment.due_date);
                  if (!dueDate) return null;
                  
                  const today = new Date();
                  const isPastDue = dueDate < today;
                  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={assignment.assignment_id} className={`bg-gray-700 rounded-lg p-4 border ${
                      isPastDue ? 'border-red-500/50' : 'border-gray-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-white">{assignment.title}</h5>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {dueDate.toLocaleDateString()}
                            </span>
                            <span>Max: {safeNumber(assignment.max_points)} points</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-2 ${
                            isPastDue ? 'text-red-400' : 'text-orange-400'
                          }`}>
                            <XCircle className="w-6 h-6" />
                            <div>
                              <div className="text-sm font-medium">Not Submitted</div>
                              {isPastDue ? (
                                <div className="text-xs text-red-400">Past Due</div>
                              ) : (
                                <div className="text-xs">
                                  {daysUntilDue === 0 ? 'Due Today' : 
                                   daysUntilDue === 1 ? 'Due Tomorrow' : 
                                   `${daysUntilDue} days left`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Assignment Performance
        </h3>

        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <p className="text-lg">No assignments found for this course.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = submissions[assignment.assignment_id];
              const maxPoints = safeNumber(assignment.max_points);
              const earnedPoints = submission && submission.points_earned !== null && submission.points_earned !== undefined ? safeNumber(submission.points_earned) : null;
              const percentage = earnedPoints !== null && maxPoints > 0 ? 
                Math.min(100, Math.max(0, (earnedPoints / maxPoints) * 100)) : 0;
              
              return (
                <div key={assignment.assignment_id} className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-all duration-300 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">{assignment.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {safeDate(assignment.due_date)?.toLocaleDateString() || 'No due date'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          Max: {maxPoints} points
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {submission ? (
                        earnedPoints !== null ? (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                              {earnedPoints.toFixed(1)}/{maxPoints}
                            </div>
                            <div className={`text-sm font-medium ${getGradeColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Graded</div>
                          </div>
                        ) : (
                          <div className="text-yellow-400 text-center">
                            <Clock className="w-8 h-8 mx-auto mb-1" />
                            <div className="text-sm font-medium">Submitted</div>
                            <div className="text-xs text-gray-400">Pending Review</div>
                          </div>
                        )
                      ) : (
                        <div className="text-red-400 text-center">
                          <XCircle className="w-8 h-8 mx-auto mb-1" />
                          <div className="text-sm font-medium">Not Submitted</div>
                          <div className="text-xs text-gray-400">Missing</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{earnedPoints !== null ? `${percentage.toFixed(1)}%` : '0%'}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ease-out ${
                          percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                          percentage >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                          percentage >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                          percentage >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                          'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ 
                          width: `${earnedPoints !== null ? percentage : 0}%`,
                          boxShadow: percentage > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {submission?.feedback && (
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500 backdrop-blur-sm">
                      <p className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Instructor Feedback:
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">{submission.feedback}</p>
                    </div>
                  )}

                  {/* Assignment Status Indicator */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-600">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {submission ? (
                        earnedPoints !== null ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>Completed & Graded</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span>Awaiting Grade</span>
                          </>
                        )
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>Action Required</span>
                        </>
                      )}
                    </div>
                    {earnedPoints !== null && (
                      <div className="text-xs text-gray-400">
                        Grade: {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;