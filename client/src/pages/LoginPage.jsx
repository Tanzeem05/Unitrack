import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const roleInfo = {
    student: {
      icon: '🎓',
      title: 'Student Portal',
      description: 'Access your courses, assignments, and academic progress',
      color: 'from-blue-500 to-purple-600'
    },
    teacher: {
      icon: '👨‍🏫',
      title: 'Teacher Dashboard',
      description: 'Manage classes, create assignments, and track student progress',
      color: 'from-green-500 to-teal-600'
    },
    admin: {
      icon: '⚙️',
      title: 'Admin Panel',
      description: 'System administration and institutional management',
      color: 'from-red-500 to-pink-600'
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Make actual API call to your backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          role // Include the selected role in the request
        })
      });

      let data = res;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again later.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Store authentication data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('username', username);
      
      // Set user in context - make sure the user object has the correct role field
      const userWithRole = {
        ...data.user,
        role: data.user.user_type || data.user.role || role // Ensure role is set correctly
      };
      
      setUser(userWithRole);

      // Set success state to show success message
      setLoginSuccess(true);

      // Navigate after a short delay to show the success message
      setTimeout(() => {
        const userRole = data.user.user_type || data.user.role || role;
        console.log('Navigating to:', userRole); // Debug log
        
        if (userRole === 'admin') {
          navigate('/admin');
        } else if (userRole === 'teacher') {
          navigate('/teacher');
        } else if (userRole === 'student') {
          navigate('/student');
        } else {
          // Fallback navigation
          navigate(`/${userRole}`);
        }
      }, 2000); // 2 second delay to show success message

    } catch (err) {
      if (!username || !password) {
        setError('Please enter both username and password');
      } else {
        setError(err.message);
      }
      setLoginSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && username && password) {
      handleLogin();
    }
  };

  if (loginSuccess) {
    const currentRole = roleInfo[role];
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
        <div className="relative p-8 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md text-center border border-white border-opacity-20">
          <div className="mb-6">
            <div className={`text-6xl mb-4 p-4 rounded-full bg-gradient-to-r ${currentRole.color} w-24 h-24 flex items-center justify-center mx-auto`}>
              {currentRole.icon}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to UniTrack!</h1>
            <p className="text-xl text-green-300 mb-1">Login Successful</p>
            <p className="text-white text-opacity-80">Hello, {username}</p>
          </div>

          <div className="mb-6 p-4 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
            <h3 className="text-lg font-semibold text-white mb-2">{currentRole.title}</h3>
            <p className="text-white text-opacity-70 text-sm">{currentRole.description}</p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-white text-opacity-60">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-opacity-30 border-t-white"></div>
            <span className="text-sm">Redirecting to your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-4 relative">
      {/* Animated background elements */}
      <div className="absolute top-20 left-20 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0s' }}>📚</div>
      <div className="absolute top-40 right-32 text-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🎯</div>
      <div className="absolute bottom-40 left-32 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '2s' }}>💡</div>
      <div className="absolute bottom-20 right-20 text-3xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}>🚀</div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                UniTrack
              </span>
            </h1>
            <p className="text-gray-300">Educational Management System</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-purple-900 bg-opacity-20 backdrop-blur-sm rounded-xl border border-purple-400 border-opacity-30">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`text-2xl p-2 rounded-lg bg-gradient-to-r ${roleInfo[role].color}`}>
              {roleInfo[role].icon}
            </div>
            <div>
              <h3 className="text-white font-semibold">{roleInfo[role].title}</h3>
              <p className="text-gray-200 text-sm">{roleInfo[role].description}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-purple-900 bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-400 border-opacity-30">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome Back</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">👤</span>
              </div>
              <input
                type="text"
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-purple-800 to-purple-900 bg-opacity-40 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔒</span>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-purple-800 to-purple-900 bg-opacity-40 border border-purple-400 border-opacity-30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">{roleInfo[role].icon}</span>
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-gradient-to-r from-purple-800 to-purple-900 bg-opacity-40 border border-purple-400 border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                disabled={isLoading}
              >
                <option value="student" className="bg-gray-800 text-white">🎓 Student Portal</option>
                <option value="teacher" className="bg-gray-800 text-white">👨‍🏫 Teacher Dashboard</option>
                <option value="admin" className="bg-gray-800 text-white">⚙️ Admin Panel</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">▼</span>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading || !username || !password}
              className={`w-full py-3 rounded-lg font-semibold transition-all transform ${isLoading || !username || !password
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : `bg-gradient-to-r ${roleInfo[role].color} hover:scale-105 hover:shadow-lg active:scale-95`
                } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-opacity-30 border-t-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <span>→</span>
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Secure educational platform for students, teachers, and administrators
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            © 2025 UniTrack Educational System. Empowering Education Through Technology.
          </p>
        </div>
      </div>
    </div>
  );
}