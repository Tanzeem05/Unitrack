import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
// import StudentDashboard from './pages/StudentDashboard';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/teacher" element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} />
      {/* <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} /> */}
    </Routes>
  );
}