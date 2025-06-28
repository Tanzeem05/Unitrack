import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CompletedCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/courses/user/${user.username}/completed`);
        if (!res.ok) {
          setCourses([]); // fallback to empty array on error
          return;
        }
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []); // ensure data is array
      } catch (err) {
        console.error('Failed to load completed courses:', err);
        setCourses([]); // fallback to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user.username]);

  if (loading) return <p>Loading completed courses...</p>;
  if (courses.length === 0) return <p>No completed courses found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Completed Courses</h1>
      <ul className="space-y-4">
        {courses.map(course => (
          <li key={course.course_code} className="p-4 bg-gray-700 rounded">
            <h3 className="text-lg font-bold">{course.course_code}</h3>
            <p className="text-gray-300">{course.course_name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
