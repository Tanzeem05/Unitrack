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

  if (loading) return <p>Loading current courses...</p>;
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
