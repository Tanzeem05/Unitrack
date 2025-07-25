// client/src/pages/student/CompletedCourseDetails/CompletedCourseDetails.jsx
import { NavLink, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Assignments from './Assignments';
import Announcements from './Announcements';
import Discussions from './Discussions';
import Resources from './Resources';
import WeeklyOverview from './WeeklyOverview';
import Results from './Results';
import { api } from '../../../utils/api';

const tabList = [
  { key: '', label: 'Overview' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'discussions', label: 'Discussions' },
  { key: 'resources', label: 'Resources' },
  { key: 'results', label: 'Results' },
];

export default function CompletedCourseDetails() {
  const { courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalGrade, setFinalGrade] = useState('N/A');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await api(`/courses/course_code/${encodeURIComponent(courseCode)}`);
        setCourse(data);
        // Calculate grade after course is fetched
        if (data) {
          await calculateFinalGrade(courseCode);
        }
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseCode]);

  const calculateFinalGrade = async (courseCode) => {
    try {
      // Fetch assignments for grade calculation
      const assignmentsData = await api(`/assignments/course_code/${courseCode}`);
      
      if (assignmentsData && assignmentsData.length > 0) {
        // Fetch submissions for each assignment
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
        
        // Calculate final grade
        const gradeData = calculateCourseGrade(assignmentsData, submissionsMap);
        setFinalGrade(gradeData.letterGrade);
      }
    } catch (error) {
      console.error('Error calculating final grade:', error);
      setFinalGrade('N/A');
    }
  };

  const calculateCourseGrade = (assignmentsData, submissionsMap) => {
    let totalPossiblePoints = 0;
    let totalEarnedPoints = 0;

    assignmentsData.forEach(assignment => {
      const submission = submissionsMap[assignment.assignment_id];
      totalPossiblePoints += assignment.max_points || 0;
      
      if (submission && submission.grade !== null) {
        totalEarnedPoints += submission.grade;
      }
    });

    const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
    
    const letterGrade = getLetterGrade(overallPercentage);
    
    return { letterGrade, percentage: overallPercentage };
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

  if (loading) return <p className="p-4">Loading course details...</p>;
  if (!course) return <p className="p-4 text-red-400">Course not found.</p>;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {course.course_code} - {course.course_name}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                ✓ Completed
              </span>
              <span className="text-gray-400">
                Completed on {new Date(course.end_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">{finalGrade}</div>
            <div className="text-sm text-gray-400">Final Grade</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex flex-wrap gap-3 mb-6">
        {tabList.map(tab => (
          <NavLink
            key={tab.key || 'overview'}
            to={`/student/completed-courses/${encodeURIComponent(courseCode)}${tab.key ? `/${tab.key}` : ''}`}
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition ${isActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <Routes>
          <Route
            index
            element={
              <div>
                <h2 className="text-xl font-semibold mb-4">Course Overview</h2>
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Course Description</h3>
                    <p className="text-gray-300">{course.description}</p>
                  </div>
                  <WeeklyOverview courseId={course.course_id} courseCode={course.course_code} />
                </div>
              </div>
            }
          />
          <Route path="assignments" element={<Assignments courseCode={course.course_code} />} />
          <Route path="announcements" element={<Announcements courseCode={course.course_code} />} />
          <Route path="discussions" element={<Discussions courseCode={course.course_code} />} />
          <Route path="resources" element={<Resources courseId={course.course_id} />} />
          <Route path="results" element={<Results courseCode={course.course_code} courseId={course.course_id} />} />
          <Route path="*" element={<h2>Tab Not Found</h2>} />
        </Routes>
      </div>
    </div>
  );
}
