// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../../utils/api';
// import { User, Calendar, Award, Star, BookOpen } from 'lucide-react';

// const CompletedCourses = () => {
//   const [courses, setCourses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [coursesWithGrades, setCoursesWithGrades] = useState([]);
//   const username = localStorage.getItem('username');
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchCourses = async () => {
//       if (!username) return;
//       try {
//         const data = await api(`/courses/user/${username}/completed`, 'GET');
//         if (data.error) {
//           setCourses([]);
//           setCoursesWithGrades([]);
//         } else {
//           setCourses(data);
//           // Fetch grades and instructors for each course
//           await fetchGradesAndInstructors(data);
//         }
//       } catch (error) {
//         console.error('Error fetching completed courses:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCourses();
//   }, [username]);

//   const fetchGradesAndInstructors = async (coursesData) => {
//     try {
//       const coursesWithDetails = await Promise.all(
//         coursesData.map(async (course) => {
//           try {
//             // Fetch assignments for grade calculation
//             const assignmentsData = await api(`/assignments/course_code/${course.course_code}`);
            
//             // Fetch instructors
//             const instructorsData = await api(`/courses/${course.course_id}/teachers`);
            
//             let finalGrade = 'N/A';
//             let starRating = 0;
            
//             if (assignmentsData && assignmentsData.length > 0) {
//               // Fetch submissions for each assignment
//               const submissionPromises = assignmentsData.map(async (assignment) => {
//                 try {
//                   const submission = await api(`/submissions/student/${assignment.assignment_id}`);
//                   return { assignmentId: assignment.assignment_id, submission };
//                 } catch (err) {
//                   return { assignmentId: assignment.assignment_id, submission: null };
//                 }
//               });
              
//               const submissionResults = await Promise.all(submissionPromises);
//               const submissionsMap = {};
//               submissionResults.forEach(({ assignmentId, submission }) => {
//                 submissionsMap[assignmentId] = submission;
//               });
              
//               // Calculate final grade
//               const gradeData = calculateCourseGrade(assignmentsData, submissionsMap);
//               finalGrade = gradeData.letterGrade;
//               starRating = gradeData.starRating;
//             }
            
//             return {
//               ...course,
//               instructor: instructorsData && instructorsData.length > 0 
//                 ? `${instructorsData[0].first_name} ${instructorsData[0].last_name}`
//                 : 'TBA',
//               finalGrade,
//               starRating
//             };
//           } catch (error) {
//             console.error(`Error fetching details for course ${course.course_code}:`, error);
//             return {
//               ...course,
//               instructor: 'TBA',
//               finalGrade: 'N/A',
//               starRating: 0
//             };
//           }
//         })
//       );
      
//       setCoursesWithGrades(coursesWithDetails);
//     } catch (error) {
//       console.error('Error fetching grades and instructors:', error);
//       setCoursesWithGrades(coursesData.map(course => ({
//         ...course,
//         instructor: 'TBA',
//         finalGrade: 'N/A',
//         starRating: 0
//       })));
//     }
//   };

//   const calculateCourseGrade = (assignmentsData, submissionsMap) => {
//     let totalPossiblePoints = 0;
//     let totalEarnedPoints = 0;

//     assignmentsData.forEach(assignment => {
//       const submission = submissionsMap[assignment.assignment_id];
//       totalPossiblePoints += assignment.max_points || 0;
      
//       if (submission && submission.grade !== null) {
//         totalEarnedPoints += submission.grade;
//       }
//     });

//     const overallPercentage = totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0;
    
//     const letterGrade = getLetterGrade(overallPercentage);
//     const starRating = getStarRating(letterGrade);
    
//     return { letterGrade, starRating, percentage: overallPercentage };
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

//   const getStarRating = (letterGrade) => {
//     switch (letterGrade) {
//       case 'A+': return 5;
//       case 'A': return 4.5;
//       case 'A-': return 4;
//       case 'B': return 4;
//       case 'B-': return 3.5;
//       case 'C': return 3;
//       case 'C-': return 2.5;
//       case 'D': return 2;
//       case 'D-': return 1;
//       case 'F': return 0;
//       default: return 0;
//     }
//   };

//   const handleViewCourse = (courseCode) => {
//     navigate(`/student/completed-courses/${courseCode}`);
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="space-y-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-2xl font-bold text-white">Completed Courses</h3>
//           <p className="text-gray-300 mt-1">Your achievements and certificates</p>
//         </div>
//         <div className="text-right">
//           <p className="text-3xl font-bold text-green-400">{coursesWithGrades.length}</p>
//           <p className="text-sm text-gray-400">Completed</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {coursesWithGrades.map((course) => (
//           <div key={course.course_id} className="group bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 hover:border-green-400 transition-all duration-300 overflow-hidden">
//             <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"></div>
//             <div className="p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex-1">
//                   <h4 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
//                     {course.course_code} - {course.course_name}
//                   </h4>
//                   <p className="text-gray-300 flex items-center">
//                     <User className="w-4 h-4 mr-2 text-green-400" />
//                     Instructor: {course.instructor || 'TBA'}
//                   </p>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <div className="text-right">
//                     <div className="flex items-center space-x-1">
//                       <Award className="w-5 h-5 text-yellow-400" />
//                       <span className="text-2xl font-bold text-green-400">{course.finalGrade || 'N/A'}</span>
//                     </div>
//                     <div className="flex items-center space-x-1 mt-1">
//                       <Star className="w-4 h-4 text-yellow-300 fill-current" />
//                       <span className="text-sm text-gray-300">{course.starRating || 0}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
//                 <span className="flex items-center">
//                   <Calendar className="w-4 h-4 mr-2 text-green-400" />
//                   Completed: {new Date(course.end_date).toLocaleDateString()}
//                 </span>
//                 <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
//                   ✓ Certified
//                 </span>
//               </div>

//               <div className="flex space-x-3">
//                 <button 
//                   onClick={() => handleViewCourse(course.course_code)}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
//                 >
//                   <BookOpen className="w-4 h-4" />
//                   <span>View Course</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default CompletedCourses;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { User, Calendar, Award, Star, BookOpen } from 'lucide-react';

const CompletedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesWithGrades, setCoursesWithGrades] = useState([]);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!username) return;
      try {
        const data = await api(`/courses/user/${username}/completed`, 'GET');
        if (data.error) {
          setCourses([]);
          setCoursesWithGrades([]);
        } else {
          setCourses(data);
          // Fetch grades and instructors for each course
          await fetchGradesAndInstructors(data);
        }
      } catch (error) {
        console.error('Error fetching completed courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [username]);

  const fetchGradesAndInstructors = async (coursesData) => {
    try {
      const coursesWithDetails = await Promise.all(
        coursesData.map(async (course) => {
          try {
            // Fetch assignments for grade calculation
            const assignmentsData = await api(`/assignments/course_code/${course.course_code}`);
            
            // Fetch instructors
            const instructorsData = await api(`/courses/${course.course_id}/teachers`);
            
            let finalGrade = 'N/A';
            let starRating = 0;
            
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
              finalGrade = gradeData.letterGrade;
              starRating = gradeData.starRating;
            }
            
            return {
              ...course,
              instructor: instructorsData && instructorsData.length > 0 
                ? `${instructorsData[0].first_name} ${instructorsData[0].last_name}`
                : 'TBA',
              finalGrade,
              starRating
            };
          } catch (error) {
            console.error(`Error fetching details for course ${course.course_code}:`, error);
            return {
              ...course,
              instructor: 'TBA',
              finalGrade: 'N/A',
              starRating: 0
            };
          }
        })
      );
      
      setCoursesWithGrades(coursesWithDetails);
    } catch (error) {
      console.error('Error fetching grades and instructors:', error);
      setCoursesWithGrades(coursesData.map(course => ({
        ...course,
        instructor: 'TBA',
        finalGrade: 'N/A',
        starRating: 0
      })));
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
    const starRating = getStarRating(letterGrade);
    
    return { letterGrade, starRating, percentage: overallPercentage };
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

  const getStarRating = (letterGrade) => {
    switch (letterGrade) {
      case 'A+': return 5;
      case 'A': return 4.5;
      case 'A-': return 4;
      case 'B': return 4;
      case 'B-': return 3.5;
      case 'C': return 3;
      case 'C-': return 2.5;
      case 'D': return 2;
      case 'D-': return 1;
      case 'F': return 0;
      default: return 0;
    }
  };

  const handleViewCourse = (courseCode) => {
    navigate(`/student/completed-courses/${courseCode}`);
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-700 rounded-lg w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-600 rounded w-56 animate-pulse"></div>
        </div>
        <div className="text-right space-y-2">
          <div className="h-10 bg-gray-700 rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl border border-purple-400 border-opacity-30 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 animate-pulse"></div>
            
            {/* Thumbnail placeholder */}
            <div className="h-48 bg-gray-800 animate-pulse"></div>
            
            <div className="p-6 space-y-4">
              {/* Title and course name */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-600 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-40 animate-pulse"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-600 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-600 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-600 rounded w-6 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Date and status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-600 rounded w-28 animate-pulse"></div>
                </div>
                <div className="h-6 bg-gray-600 rounded-full w-20 animate-pulse"></div>
              </div>

              {/* Button */}
              <div className="h-12 bg-gray-600 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
        </div>
        <span className="ml-4 text-gray-400 animate-pulse">Loading your achievements...</span>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Completed Courses</h3>
          <p className="text-gray-300 mt-1">Your achievements and certificates</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-400">{coursesWithGrades.length}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithGrades.map((course) => (
          <div key={course.course_id} className="group bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 hover:border-green-400 transition-all duration-300 overflow-hidden transform hover:scale-105">
            <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            {course.thumbnail && (
              <div className="h-48 bg-gray-800 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.course_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-1 group-hover:text-green-300 transition-colors">
                    {course.course_code}
                  </h4>
                  {course.course_name && (
                    <p className="text-gray-400 text-sm mb-3">{course.course_name}</p>
                  )}
                  <p className="text-gray-300 flex items-center">
                    <User className="w-4 h-4 mr-2 text-green-400" />
                    <span className="font-medium">{course.instructor || 'TBA'}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-green-400">{course.finalGrade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-300 fill-current" />
                    <span className="text-sm text-gray-300">{course.starRating || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-green-400" />
                  Completed: {new Date(course.end_date).toLocaleDateString()}
                </span>
                <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Certified
                </span>
              </div>

              <button 
                onClick={() => handleViewCourse(course.course_code)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Course</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedCourses;