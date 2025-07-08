


import { NavLink, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Assignments from './Assignments';
import Announcements from './Announcements';
import Discussions from './Discussions';
import { api } from '../../../utils/api';

const tabList = [
  { key: '', label: 'Overview' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'discussions', label: 'Discussions' },
  { key: 'resources', label: 'Resources' },
  { key: 'results', label: 'Results' },
];

export default function CourseDetails() {
  const { courseCode } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await api(`/courses/course_code/${encodeURIComponent(courseCode)}`);
        setCourse(data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseCode]);

  if (loading) return <p className="p-4">Loading course details...</p>;
  if (!course) return <p className="p-4 text-red-400">Course not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {course.course_code} - {course.course_name}
      </h1>

      {/* Tab Navigation */}
      <nav className="flex flex-wrap gap-3 mb-6">
        {tabList.map(tab => (
          <NavLink
            key={tab.key || 'overview'}
            to={`/student/courses/${encodeURIComponent(courseCode)}${tab.key ? `/${tab.key}` : ''}`}
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition ${isActive
                ? 'bg-blue-500 text-white'
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
                <h2 className="text-xl font-semibold mb-2">Course Overview</h2>
                <p className="text-gray-300">{course.description}</p>
              </div>
            }
          />
          <Route path="assignments" element={<Assignments courseCode={course.course_code} />} />
          <Route path="announcements" element={<Announcements courseCode={course.course_code} />} />
          <Route path="discussions" element={<Discussions courseCode={course.course_code} />} />
          <Route path="resources" element={<h2>Resources content here</h2>} />
          <Route path="results" element={<h2>Results content here</h2>} />
          <Route path="*" element={<h2>Tab Not Found</h2>} />
        </Routes>
      </div>
    </div>
  );
}
