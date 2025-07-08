import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { User, Calendar, Award, Star, Download } from 'lucide-react';

const CompletedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!username) return;
      try {
        const data = await api(`/courses/user/${username}/completed`, 'GET');
        if (data.error) {
          setCourses([]);
        } else {
          setCourses(data);
        }
      } catch (error) {
        console.error('Error fetching completed courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [username]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Completed Courses</h3>
          <p className="text-gray-300 mt-1">Your achievements and certificates</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-400">{courses.length}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="group bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30 hover:border-green-400 transition-all duration-300 overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-gray-300 flex items-center">
                    <User className="w-4 h-4 mr-2 text-green-400" />
                    {course.instructor}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold text-green-400">{course.grade}</span>
                    </div>
                    {course.rating && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-300 fill-current" />
                        <span className="text-sm text-gray-300">{course.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-green-400" />
                  Completed: {new Date(course.completedDate).toLocaleDateString()}
                </span>
                {course.certificate && (
                  <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Certified
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Certificate</span>
                </button>
                <button className="px-4 py-3 border-2 border-green-600 text-green-500 rounded-xl hover:bg-green-900/50 transition-all duration-200 font-semibold">
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedCourses;