import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CurrentCourses from './student/CurrentCourses';
import CompletedCourses from './student/CompletedCourses';
import CourseDetails from './student/CourseDetails/CourseDetails';

export default function StudentDashboard() {
  const navLinks = [
    { to: '/student', label: 'Current Courses' },
    { to: '/student/completed', label: 'Completed Courses' },
    { to: '/student/announcements', label: 'Global Announcements' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white flex">
      <Sidebar links={navLinks} title="Student Panel" />
      <main className="flex-1">
        <Header title="Student Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CurrentCourses />} />
            <Route path="completed" element={<CompletedCourses />} />
            <Route path="announcements" element={<h1 className="text-2xl font-semibold">Global Announcements</h1>} />
            <Route path="courses/:courseCode/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}