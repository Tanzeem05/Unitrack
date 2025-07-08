import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

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
    return <p className="p-4">Loading courses...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-400">{error}</p>;
  }

  if (courses.length === 0) {
    return <p className="p-4">No courses found for this teacher.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Courses</h1>
      <ul className="space-y-4">
        {courses.map(course => (
          <li key={course.course_id}>
            <button
              onClick={() => navigate(`/teacher/courses/${course.course_id}`)}
              className="block w-full text-left p-4 bg-gray-700 rounded hover:bg-gray-600 transition"
            >
              <h3 className="text-lg font-bold">{course.course_code}</h3>
              <p className="text-gray-300">{course.course_name}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}