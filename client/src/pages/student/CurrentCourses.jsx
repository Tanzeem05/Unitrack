import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { User, Calendar } from 'lucide-react';

const CurrentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!username) return;
      try {
        const data = await api(`/courses/user/${username}/current`, 'GET');
        if (data.error) {
          setCourses([]);
        } else {
          setCourses(data);
        }
      } catch (error) {
        console.error('Error fetching current courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [username]);

  const handleContinueLearning = (courseCode) => {
    navigate(`/student/courses/${courseCode}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Your Active Courses</h3>
          <p className="text-gray-300 mt-1">Continue your learning journey</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-purple-400">{courses.length}</p>
          <p className="text-sm text-gray-400">Active</p>
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
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6">
              <h4 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                {course.course_code}
              </h4>
              <p className="text-gray-300 mb-4 flex items-center">
                <User className="w-4 h-4 mr-2 text-purple-400" />
                {course.instructor}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold text-purple-400">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-400 mb-6">
                <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                {course.nextClass ? (
                  <span>
                    Next: {new Date(course.nextClass).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                ) : (
                  <span>No upcoming class</span>
                )}
              </div>

              <button
                onClick={() => handleContinueLearning(course.course_code)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentCourses;