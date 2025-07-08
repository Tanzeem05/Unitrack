import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import TeacherSidebar from './teacher/TeacherSidebar';
import CoursesPage from './teacher/CoursePage';
import CourseDetails from './teacher/CourseDetails';
import GlobalAnnouncement from './admin/GlobalAnnouncement'; // Assuming this is the correct path for Global Announcements

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const navigate = useNavigate();

  

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'courses') {
      navigate('/teacher');
    } else if (tab === 'announcements') {
      navigate('/teacher/announcements');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white flex">
      <TeacherSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 ml-72">
        <Header title="Teacher Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CoursesPage />} />
            <Route path="announcements" element={<GlobalAnnouncement />} />
            <Route path="courses/:courseId/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}