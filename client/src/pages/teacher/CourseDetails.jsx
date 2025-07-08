import { NavLink, Routes, Route, useParams } from 'react-router-dom';
import Assignments from './Assignments';
import AssignmentSubmissions from './AssignmentSubmissions';

export default function CourseDetails() {
  const { courseId } = useParams();
  const tabs = ['assignments', 'announcements', 'discussions', 'messages', 'resources'];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Course Details - ID: {courseId}</h1>
      <nav className="flex gap-4 mb-4">
        {tabs.map(tab => (
          <NavLink
            key={tab}
            to={`/teacher/courses/${courseId}/${tab}`}
            className={({ isActive }) =>
              isActive ? 'text-blue-400 font-bold' : 'text-gray-300 hover:text-white'
            }
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route path="assignments/*" element={<Assignments />} />
        <Route path="assignments/:assignmentId/submissions" element={<AssignmentSubmissions />} />
        <Route path="announcements" element={<h2>Announcements</h2>} />
        <Route path="discussions" element={<h2>Discussions</h2>} />
        <Route path="messages" element={<h2>Messages</h2>} />
        <Route path="resources" element={<h2>Resources</h2>} />
      </Routes>
    </div>
  );
}
