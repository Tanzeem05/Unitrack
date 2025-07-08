import { NavLink, Routes, Route, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Assignments from './Assignments';
import AssignmentSubmissions from './AssignmentSubmissions';
import Announcements from './Announcements';
import Discussions from './Discussions';
import { api } from '../../utils/api';

const tabList = [
  { key: '', label: 'Overview' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'discussions', label: 'Discussions' },
  { key: 'resources', label: 'Resources' },
];

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await api(`/courses/course/${courseId}`);
        setCourse(data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

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
            to={`/teacher/courses/${courseId}${tab.key ? `/${tab.key}` : ''}`}
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
                <p className="text-gray-300">{course.description || 'No description available for this course.'}</p>
              </div>
            }
          />
          <Route path="assignments/*" element={<Assignments courseId={courseId} />} />
          <Route path="submissions" element={<AssignmentSubmissions />} />
          <Route path="announcements" element={<Announcements courseId={courseId} />} />
          <Route path="discussions" element={<Discussions courseId={courseId} />} />
          <Route path="resources" element={<h2>Resources</h2>} />
          <Route path="*" element={<h2>Tab Not Found</h2>} />
        </Routes>
      </div>
    </div>
  );
}
