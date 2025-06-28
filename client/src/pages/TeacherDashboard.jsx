import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CoursesPage from './teacher/CoursePage';
import CourseDetails from './teacher/CourseDetails';

export default function TeacherDashboard() {
  const navLinks = [
    { to: '', label: 'My Courses' },
    { to: 'announcements', label: 'Global Announcements' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar links={navLinks} title="Teacher Panel" />
      <main className="flex-1">
        <Header title="Teacher Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CoursesPage />} />
            <Route path="announcements" element={<h1 className="text-2xl font-semibold">Global Announcements</h1>} />
            <Route path="courses/:courseId/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}