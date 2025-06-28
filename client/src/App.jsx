<<<<<<< HEAD
=======
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './index.css';
>>>>>>> master
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
<<<<<<< HEAD
// import StudentDashboard from './pages/StudentDashboard';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();

=======
import StudentDashboard from './pages/StudentDashboard';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-lg">Loading...</div>; // or a spinner
  }
  
>>>>>>> master
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/teacher" element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} />
<<<<<<< HEAD
      {/* <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} /> */}
    </Routes>
  );
}
=======
      <Route path="/student/*" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
    </Routes>
  );
}

>>>>>>> master
