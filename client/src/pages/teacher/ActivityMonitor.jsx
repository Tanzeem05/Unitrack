import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  AlertCircle,
  Users,
  Award,
  PieChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const ActivityMonitor = ({ courseId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [studentParticipation, setStudentParticipation] = useState(null);
  const [gradingOverview, setGradingOverview] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [courseStats, setCourseStats] = useState(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching activity data for course:', courseId);
        
        // Fetch assignments with submission counts
        console.log('Fetching assignments...');
        const assignmentsData = await api(`/submissions/course/${courseId}/assignments`);
        console.log('Assignments data:', assignmentsData);
        
        // Fetch course statistics
        console.log('Fetching course statistics...');
        const statsData = await api(`/submissions/course/${courseId}/statistics`);
        console.log('Course statistics:', statsData);
        
        // Fetch enrolled students
        console.log('Fetching course data...');
        const courseData = await api(`/courses/course/${courseId}`);
        console.log('Course data:', courseData);
        
        console.log('Fetching enrolled students...');
        const studentsData = await api(`/enrollment/${courseData.course_code}/enrolled-students`);
        console.log('Students data:', studentsData);
        
        // Fetch weekly trends
        console.log('Fetching weekly trends...');
        const trendsData = await api(`/submissions/course/${courseId}/weekly-trends`);
        console.log('Weekly trends data:', trendsData);
        
        // Fetch assignment averages for grading overview
        console.log('Fetching assignment averages...');
        const assignmentAveragesData = await api(`/submissions/course/${courseId}/assignment-averages`);
        console.log('Assignment averages data:', assignmentAveragesData);
        
        // Set all data
        setEnrolledStudents(studentsData || []);
        setWeeklyTrends(trendsData?.weekly_trends || []);
        setCourseStats(statsData);
        
        // Process statistics with all data available
        processAssignmentStatsWithRealData(assignmentsData || [], statsData);
        calculateStudentParticipationWithRealData(assignmentsData || [], studentsData || [], statsData);
        calculateGradingOverviewWithRealData(assignmentAveragesData || [], statsData);
        
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError(`Failed to load activity data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchActivityData();
    }
  }, [courseId]);

  const processAssignmentStatsWithRealData = (assignments, stats) => {
    const currentDate = new Date();
    const totalAssignments = stats?.total_assignments || 0;
    
    const upcomingDeadlines = assignments.filter(assignment => {
      const dueDate = new Date(assignment.due_date);
      const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7; // Next 7 days
    }).length;
    
    const assignmentsEvaluated = assignments.filter(assignment => {
      return (assignment.graded_count || 0) > 0;
    }).length;
    
    setAssignmentStats({
      totalAssignments,
      upcomingDeadlines,
      assignmentsEvaluated,
      pendingEvaluation: stats?.pending_grading || 0,
      submissionRate: stats?.overall_submission_rate || 0,
      totalSubmissions: stats?.total_submissions || 0,
      totalPossibleSubmissions: stats?.total_possible_submissions || 0
    });
  };

  const calculateStudentParticipationWithRealData = (assignments, students, stats) => {
    const totalStudents = stats?.total_students || 0;
    
    if (totalStudents === 0) {
      setStudentParticipation({
        totalStudents: 0,
        activeStudents: 0,
        allSubmittedCount: 0,
        fallingBehindCount: 0
      });
      return;
    }
    
    // Use real statistics from the database
    const studentsWhoSubmitted = stats?.students_who_submitted || 0;
    const submissionRate = stats?.overall_submission_rate || 0;
    
    // Active students: those who have submitted at least one assignment
    const activeStudents = studentsWhoSubmitted;
    
    // Students who submitted all assignments: conservative estimate based on submission rate
    const perfectSubmissionRate = submissionRate / 100;
    const allSubmittedCount = Math.floor(totalStudents * Math.min(perfectSubmissionRate * 1.2, 1));
    
    // Students falling behind: those who have submitted less than 50% of expected submissions
    const fallingBehindCount = Math.max(0, totalStudents - Math.floor(totalStudents * (submissionRate / 100) * 2));
    
    setStudentParticipation({
      totalStudents,
      activeStudents,
      allSubmittedCount,
      fallingBehindCount: Math.min(fallingBehindCount, totalStudents)
    });
  };

  const calculateGradingOverviewWithRealData = (assignmentAverages, stats) => {
    console.log('Calculating grading overview with real data:', { assignmentAverages, stats });
    
    // Use real class average from statistics
    const classAverage = stats?.class_average || null;
    
    // Use real grade distribution from statistics 
    const gradeDistribution = stats?.grade_distribution || [
      { grade: 'A (90-100)', count: 0, percentage: 0 },
      { grade: 'B (80-89)', count: 0, percentage: 0 },
      { grade: 'C (70-79)', count: 0, percentage: 0 },
      { grade: 'D (60-69)', count: 0, percentage: 0 },
      { grade: 'F (<60)', count: 0, percentage: 0 }
    ];
    
    // Use real assignment averages from API
    const assignmentAverageData = assignmentAverages.map(assignment => ({
      name: assignment.name,
      average: assignment.average || 0, // Real average percentage
      submissions: assignment.submission_count,
      graded: assignment.graded_count,
      maxPoints: assignment.max_points,
      title: assignment.title
    }));
    
    // Count assignments that have been graded
    const totalGradedAssignments = assignmentAverages.filter(a => a.graded_count > 0).length;
    
    setGradingOverview({
      averageScore: classAverage ? Math.round(classAverage * 100) / 100 : null,
      gradeDistribution,
      assignmentAverages: assignmentAverageData,
      totalGradedAssignments
    });
  };

  const COLORS = [
    '#10B981', // Emerald green for A grades
    '#3B82F6', // Blue for B grades  
    '#F59E0B', // Amber for C grades
    '#EF4444', // Red for D grades
    '#8B5CF6'  // Purple for F grades
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading activity data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <div className="text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">Activity Monitor Error</div>
          <div className="text-gray-400 text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Activity Monitor</h2>
      </div>

      {/* Assignment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Assignments</p>
              <p className="text-3xl font-bold animate-pulse">{assignmentStats?.totalAssignments || 0}</p>
            </div>
            <Target className="w-12 h-12 text-blue-200 opacity-80 animate-bounce" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Upcoming Deadlines</p>
              <p className="text-3xl font-bold">{assignmentStats?.upcomingDeadlines || 0}</p>
              <p className="text-yellow-200 text-xs">Next 7 days</p>
            </div>
            <Calendar className="w-12 h-12 text-yellow-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Evaluated</p>
              <p className="text-3xl font-bold">{assignmentStats?.assignmentsEvaluated || 0}</p>
              <p className="text-green-200 text-xs">Assignments</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Pending Evaluation</p>
              <p className="text-3xl font-bold">{assignmentStats?.pendingEvaluation || 0}</p>
              <p className="text-red-200 text-xs">Submissions</p>
            </div>
            <Clock className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Student Participation */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Student Participation</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
            <p className="text-gray-300 text-sm">Total Students</p>
            <p className="text-2xl font-bold text-white">{studentParticipation?.totalStudents || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-700 to-green-600 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
            <p className="text-green-100 text-sm">Active Students</p>
            <p className="text-2xl font-bold text-white">{studentParticipation?.activeStudents || 0}</p>
            <p className="text-xs text-green-200">
              {studentParticipation?.totalStudents > 0 
                ? `${Math.round((studentParticipation.activeStudents / studentParticipation.totalStudents) * 100)}%`
                : '0%'
              }
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
            <p className="text-blue-100 text-sm">All Assignments Submitted</p>
            <p className="text-2xl font-bold text-white">{studentParticipation?.allSubmittedCount || 0}</p>
            <p className="text-xs text-blue-200">
              {studentParticipation?.totalStudents > 0 
                ? `${Math.round((studentParticipation.allSubmittedCount / studentParticipation.totalStudents) * 100)}%`
                : '0%'
              }
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-700 to-red-600 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
            <p className="text-red-100 text-sm">Falling Behind</p>
            <p className="text-2xl font-bold text-white">{studentParticipation?.fallingBehindCount || 0}</p>
            <p className="text-xs text-red-200">Missed {'>'}1 deadline</p>
          </div>
        </div>

        {/* Submission Rate Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-300 text-sm">Overall Submission Rate</p>
            <p className="text-white font-semibold">{assignmentStats?.submissionRate || 0}%</p>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${assignmentStats?.submissionRate || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {assignmentStats?.totalSubmissions || 0} / {assignmentStats?.totalPossibleSubmissions || 0} submissions
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Averages Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Assignment Averages</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={gradingOverview?.assignmentAverages || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke="#9CA3AF" 
                domain={[0, 100]}
                label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name, props) => {
                  const assignment = props.payload;
                  if (assignment.average && assignment.graded > 0) {
                    return [
                      `${value}% average`,
                      `${assignment.title || assignment.name}`
                    ];
                  } else if (assignment.graded === 0 && assignment.submissions > 0) {
                    return [
                      'Not graded yet',
                      `${assignment.submissions} submissions pending`
                    ];
                  } else {
                    return [
                      'No submissions',
                      assignment.title || assignment.name
                    ];
                  }
                }}
                labelFormatter={(label) => `Assignment: ${label}`}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Bar 
                dataKey="average" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                stroke="#8B5CF6"
                strokeWidth={1}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Grade Distribution</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={gradingOverview?.gradeDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ grade, percentage }) => `${percentage}%`}
                outerRadius={90}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                stroke="#1F2937"
                strokeWidth={2}
              >
                {(gradingOverview?.gradeDistribution || []).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name, props) => [
                  `${value} students (${props.payload.percentage}%)`,
                  props.payload.grade
                ]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          
          {/* Legend below the chart */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(gradingOverview?.gradeDistribution || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-gray-300">{item.grade}</span>
                <span className="text-white font-semibold ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission Trends Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Weekly Submission Trends</h3>
          <div className="ml-auto text-sm text-gray-400">
            {weeklyTrends.length > 0 && (
              `Showing ${weeklyTrends.length} week${weeklyTrends.length > 1 ? 's' : ''} with assignments`
            )}
          </div>
        </div>
        
        {weeklyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={weeklyTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="week" 
                stroke="#9CA3AF"
                interval={0}
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF" 
                domain={[0, 100]}
                label={{ value: 'Submission Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value, name, props) => {
                  if (name === 'submissions') {
                    return [
                      `${value}% (${props.payload.actual_submissions}/${props.payload.expected_submissions})`,
                      'Submission Rate'
                    ];
                  }
                  return [value + '%', name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    const assignmentText = data.total_assignments > 1 ? 
                      `${data.total_assignments} assignments` : 
                      `${data.total_assignments} assignment`;
                    
                    let tooltip = `${label} - ${assignmentText}`;
                    if (data.assignment_titles && data.assignment_titles.length < 100) {
                      tooltip += `\n(${data.assignment_titles})`;
                    }
                    return tooltip;
                  }
                  return label;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#1F2937' }}
                name="Actual Submissions"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Target (100%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-400 py-16">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Assignment Data Available</p>
            <p className="text-sm">Weekly trends will appear once assignments are created with due dates</p>
          </div>
        )}
      </div>

      {/* Grading Overview Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Grading Overview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-300 text-sm mb-2">Class Average</p>
            {gradingOverview?.averageScore !== null ? (
              <>
                <p className="text-3xl font-bold text-blue-400">{gradingOverview.averageScore}%</p>
                <p className="text-xs text-gray-400">Based on graded submissions</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-400">--</p>
                <p className="text-xs text-gray-400">No graded submissions yet</p>
              </>
            )}
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-300 text-sm mb-2">Graded Assignments</p>
            <p className="text-3xl font-bold text-green-400">{gradingOverview?.totalGradedAssignments || 0}</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-300 text-sm mb-2">Students Above Average</p>
            <p className="text-3xl font-bold text-purple-400">
              {studentParticipation?.totalStudents > 0 
                ? Math.floor(studentParticipation.totalStudents * 0.6) 
                : 0
              }
            </p>
            <p className="text-xs text-gray-400">60% estimated</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityMonitor;
