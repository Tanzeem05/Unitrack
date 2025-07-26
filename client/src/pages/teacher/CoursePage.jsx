// import { Link, useNavigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { api } from '../../utils/api';

// export default function CoursesPage() {
//   const { user, isLoading: authLoading } = useAuth();
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchCourses = async () => {
//       try {
//         setLoading(true);
//         const data = await api(`/courses/teacher/${user.username}`);
//         setCourses(data);
//       } catch (err) {
//         console.error('Failed to fetch courses:', err);
//         setError('Failed to load courses.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (!authLoading && user && user.username) {
//       fetchCourses();
//     } else if (authLoading) {
//       // Auth context still loading, waiting...
//     } else {
//       // User or username not available after auth load, skipping fetch.
//       setLoading(false);
//     }
//   }, [user, authLoading]);

//   if (loading) {
//     return <p className="p-4">Loading courses...</p>;
//   }

//   if (error) {
//     return <p className="p-4 text-red-400">{error}</p>;
//   }

//   if (courses.length === 0) {
//     return <p className="p-4">No courses found for this teacher.</p>;
//   }

//   return (
//     <div>
//       <h1 className="text-2xl font-semibold mb-4">My Courses</h1>
//       <ul className="space-y-4">
//         {courses.map(course => (
//           <li key={course.course_id}>
//             <button
//               onClick={() => navigate(`/teacher/courses/${course.course_id}`)}
//               className="block w-full text-left p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
//             >
//               <h3 className="text-lg font-bold">{course.course_code}</h3>
//               <p className="text-gray-300">{course.course_name}</p>
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }



import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { Calendar, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await api(`/courses/teacher/${user.username}`);
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && user.username) {
      fetchCourses();
    } else if (authLoading) {
      // Auth context still loading, waiting...
    } else {
      // User or username not available after auth load, skipping fetch.
      setLoading(false);
    }
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading your courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 p-8">
          <h4 className="text-xl font-bold text-white mb-4">Error Loading Courses</h4>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">My Courses</h3>
            <p className="text-gray-300 mt-1">Manage your teaching courses</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-400">0</p>
            <p className="text-sm text-gray-400">Courses</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 p-8">
            <h4 className="text-xl font-bold text-white mb-4">No Courses Found</h4>
            <p className="text-gray-300 mb-6">
              No courses found for this teacher. Contact your administrator if you believe this is an error.
            </p>
            <div className="text-sm text-gray-400">
              Username: {user?.username}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">My Courses</h3>
          <p className="text-gray-300 mt-1">Manage your teaching courses</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-purple-400">{courses.length}</p>
          <p className="text-sm text-gray-400">Course{courses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.course_id} className="group bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 hover:border-purple-300 transition-all duration-300 overflow-hidden transform hover:scale-105">
            <div className="h-3 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
            {course.thumbnail && (
              <div className="h-48 bg-gray-800 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.course_name || course.course_code}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6">
              <h4 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                {course.course_code}
              </h4>
              {course.course_name && (
                <p className="text-gray-400 text-sm mb-3">{course.course_name}</p>
              )}

              {/* Student count */}
              {course.student_count !== undefined && (
                <p className="text-gray-300 mb-4 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="font-medium">{course.student_count} student{course.student_count !== 1 ? 's' : ''} enrolled</span>
                </p>
              )}

              {/* Progress section */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span className="font-medium">Course Progress</span>
                  <div className="text-right">
                    <span className="font-bold text-purple-400">{course.progress || 0}%</span>
                    {course.weeks_passed !== undefined && course.total_weeks > 0 && (
                      <div className="text-xs text-gray-400">
                        Week {course.weeks_passed} of {course.total_weeks}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-400 mb-6">
                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                {course.next_due_date ? (
                  <span>
                    Next Evaluation: {new Date(course.next_due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {course.upcoming_count > 1 && (
                      <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                        +{course.upcoming_count - 1} more
                      </span>
                    )}
                  </span>
                ) : course.upcoming_count > 0 ? (
                  <span>
                    {course.upcoming_count} upcoming evaluation{course.upcoming_count > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>No pending evaluations</span>
                )}
              </div>

              <button
                onClick={() => navigate(`/teacher/courses/${course.course_id}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Manage Course
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}