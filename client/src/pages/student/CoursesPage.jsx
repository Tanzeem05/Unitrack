// CoursesPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api(`/courses/user/${user.username}/current`);
        setCourses(data);
      } catch (err) {
        console.error('Failed to load current courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user.username]);

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      
      {/* Header skeleton that matches the actual header */}
      <div className="mb-4">
        <div className="relative h-8 bg-gray-700 rounded-lg w-64 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/20 to-transparent translate-x-[-100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
      
      {/* Course cards skeleton list */}
      <ul className="space-y-4">
        {[1, 2, 3, 4].map((index) => (
          <li key={index}>
            <div className="relative block p-4 bg-gray-700 rounded hover:bg-gray-600 transition-all duration-300 overflow-hidden group">
              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1s_ease-in-out_infinite]"></div>
              
              <div className="relative space-y-2">
                {/* Course code skeleton */}
                <div className="flex items-center justify-between">
                  <div className="relative h-7 bg-gray-600 rounded w-36 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_ease-in-out_infinite]" style={{animationDelay: `${index * 0.2}s`}}></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
                {/* Course name skeleton */}
                <div className="relative h-5 bg-gray-500 rounded w-80 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_ease-in-out_infinite]" style={{animationDelay: `${index * 0.2 + 0.1}s`}}></div>
                </div>
              </div>
              
              {/* Loading pulse border */}
              <div className="absolute inset-0 border-2 border-blue-500/20 rounded animate-pulse" style={{animationDelay: `${index * 0.3}s`}}></div>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Enhanced loading indicator */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '-0.3s'}}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '-0.15s'}}></div>
          <div className="w-3 h-3 bg-blue-700 rounded-full animate-bounce"></div>
        </div>
        <div className="text-gray-400 animate-pulse text-center">
          <p className="text-sm font-medium">Loading your current courses...</p>
          <div className="flex items-center justify-center space-x-1 mt-2">
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-ping"></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton />;
  if (courses.length === 0) return <p>No current courses found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Current Courses</h1>
      <ul className="space-y-4">
        {courses.map(course => (
          <li key={course.course_code}>
            <Link
              // to={`courses/${course.course_code}`}
              to={`courses/${encodeURIComponent(course.course_code)}`}
              className="block p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <h3 className="text-lg font-bold">{course.course_code}</h3>
              <p className="text-gray-300">{course.course_name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
