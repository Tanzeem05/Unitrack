import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CoursesPage from './Student/CoursesPage';
import CompletedCourses from './student/CompletedCourses';
import CourseDetails from './student/CourseDetails/CourseDetails';

export default function StudentDashboard() {
  // const navLinks = [
  //   { to: '', label: 'Current Courses' },
  //   { to: 'completed', label: 'Completed Courses' },
  //   { to: 'announcements', label: 'Global Announcements' }
  // ];

  const navLinks = [
  { to: '/student', label: 'Current Courses' },
  { to: '/student/completed', label: 'Completed Courses' },
  { to: '/student/announcements', label: 'Global Announcements' }
];


  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar links={navLinks} title="Student Panel" />
      <main className="flex-1">
        <Header title="Student Dashboard" />
        <div className="p-6">
          <Routes>
            <Route index element={<CoursesPage />} />
            <Route path="completed" element={<CompletedCourses />} />
            <Route path="announcements" element={<h1 className="text-2xl font-semibold">Global Announcements</h1>} />
            <Route path="courses/:courseCode/*" element={<CourseDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}


// import React, { useState, useEffect } from 'react';
// import {
//   BookOpen,
//   CheckCircle,
//   Bell,
//   User,
//   Settings,
//   LogOut,
//   Menu,
//   X,
//   GraduationCap,
//   Clock,
//   Award,
//   Download,
//   Star,
//   Calendar
// } from 'lucide-react';

// // API service with backend integration
// const ApiService = {

//   // Get current courses - CHANGED: Integrated with your backend API
//   async getCurrentCourses(username) {
//     console.log(`🔍 Fetching current courses for user: ${username}`);
//     console.log(`🌐 API URL: /api/user/${username}/current`);

//     try {
//       const res = await fetch(`/api/courses/user/${username}/current`);
//       console.log(`📡 Response status: ${res.status}`);
//       console.log(`📡 Response ok: ${res.ok}`);

//       if (!res.ok) {
//         console.warn(`❌ Backend API failed with status ${res.status}, using mock data`);
//         const errorText = await res.text();
//         console.error(`❌ Error response: ${errorText}`);
//         return this.getMockData('/student/courses/current');
//       }

//       const data = await res.json();
//       console.log('✅ Successfully fetched current courses:', data);
//       return data;
//     } catch (error) {
//       console.error('❌ Network error fetching current courses:', error);
//       console.error('❌ This usually means the backend server is not running or CORS issue');
//       // Fallback to mock data if API fails
//       return this.getMockData('/student/courses/current');
//     }
//   },

//   // Get completed courses - CHANGED: Integrated with your backend API
//   async getCompletedCourses(username) {
//     console.log(`🔍 Fetching completed courses for user: ${username}`);
//     console.log(`🌐 API URL: /api/user/${username}/completed`);

//     try {
//       const res = await fetch(`/api/courses/user/${username}/completed`);
//       console.log(`📡 Response status: ${res.status}`);
//       console.log(`📡 Response ok: ${res.ok}`);

//       if (!res.ok) {
//         console.warn(`❌ Backend API failed with status ${res.status}, using mock data`);
//         const errorText = await res.text();
//         console.error(`❌ Error response: ${errorText}`);
//         return this.getMockData('/student/courses/completed');
//       }

//       const data = await res.json();
//       console.log('✅ Successfully fetched completed courses:', data);
//       return data;
//     } catch (error) {
//       console.error('❌ Network error fetching completed courses:', error);
//       console.error('❌ This usually means the backend server is not running or CORS issue');
//       // Fallback to mock data if API fails
//       return this.getMockData('/student/courses/completed');
//     }
//   },

//   // Get announcements - CHANGED: Added username parameter for consistency
//   async getAnnouncements(username) {
//     try {
//       // You can implement backend API for announcements later
//       // const res = await fetch(`/api/user/${username}/announcements`);
//       // For now, using mock data
//       await new Promise(resolve => setTimeout(resolve, 500));
//       return this.getMockData('/student/announcements');
//     } catch (error) {
//       console.error('Error fetching announcements:', error);
//       return this.getMockData('/student/announcements');
//     }
//   }
// };

// // Loading Component
// const LoadingCard = () => (
//   <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
//     <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
//     <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
//     <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
//     <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
//   </div>
// );

// // Sidebar Component
// const Sidebar = ({ isOpen, onClose, activeTab, onTabChange }) => {
//   const navItems = [
//     { id: 'current', label: 'Current Courses', icon: BookOpen, count: 3 },
//     { id: 'completed', label: 'Completed Courses', icon: CheckCircle, count: 12 },
//     { id: 'announcements', label: 'Announcements', icon: Bell, count: 2 }
//   ];

//   return (
//     <>
//       {/* Overlay for mobile */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Sidebar */}
//       <div className={`fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 transform transition-all duration-300 ease-in-out z-50 lg:translate-x-0 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
//         <div className="p-6 border-b border-purple-700/50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
//                 <GraduationCap className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-white">UniPortal</h1>
//                 <p className="text-purple-300 text-sm">Student Dashboard</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="lg:hidden text-purple-300 hover:text-white transition-colors"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         <nav className="p-4 space-y-2">
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             return (
//               <button
//                 key={item.id}
//                 onClick={() => onTabChange(item.id)}
//                 className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
//                   ? 'bg-purple-700 text-white shadow-lg transform scale-105'
//                   : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
//                   }`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <Icon className="w-5 h-5" />
//                   <span className="font-medium">{item.label}</span>
//                 </div>
//                 {item.count > 0 && (
//                   <span className={`text-xs px-2 py-1 rounded-full ${activeTab === item.id ? 'bg-purple-600' : 'bg-purple-700 group-hover:bg-purple-600'
//                     }`}>
//                     {item.count}
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </nav>

//         <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700/50">
//           <div className="flex items-center space-x-3 p-4 rounded-xl bg-purple-800/50 backdrop-blur-sm">
//             <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
//               <User className="w-5 h-5 text-white" />
//             </div>
//             <div className="flex-1">
//               <p className="text-sm font-medium text-white">John Doe</p>
//               <p className="text-xs text-purple-300">Computer Science</p>
//             </div>
//             <button className="text-purple-300 hover:text-white transition-colors">
//               <LogOut className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// // Header Component
// const Header = ({ onMenuClick, title }) => {
//   return (
//     <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
//       <div className="flex items-center justify-between p-4">
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={onMenuClick}
//             className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
//           >
//             <Menu className="w-6 h-6 text-gray-600" />
//           </button>
//           <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
//             {title}
//           </h2>
//         </div>

//         <div className="flex items-center space-x-3">
//           <button className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors">
//             <Bell className="w-6 h-6 text-gray-600" />
//             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
//           </button>
//           <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
//             <Settings className="w-6 h-6 text-gray-600" />
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

// // Current Courses Component
// const CurrentCourses = ({ courses, loading }) => {
//   if (loading) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {[1, 2, 3].map((_, idx) => <LoadingCard key={idx} />)}
//       </div>
//     );
//   }

//   console.log("Courses list:", courses.map(c => c.id));
//   return (
//     <div className="space-y-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-2xl font-bold text-gray-800">Your Active Courses</h3>
//           <p className="text-gray-600 mt-1">Continue your learning journey</p>
//         </div>
//         <div className="text-right">
//           <p className="text-3xl font-bold text-purple-600">{courses.length}</p>
//           <p className="text-sm text-gray-500">Active</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {courses.map((course) => (
//           <div key={course.course_id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 transform hover:scale-105">
//             <div className="h-3 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
//             {course.thumbnail && (
//               <div className="h-48 bg-gray-100 overflow-hidden">
//                 <img
//                   src={course.thumbnail}
//                   alt={course.title}
//                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
//                 />
//               </div>
//             )}
//             <div className="p-6">
//               <h4 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
//                 {course.course_code}
//               </h4>
//               <p className="text-gray-600 mb-4 flex items-center">
//                 <User className="w-4 h-4 mr-2 text-purple-500" />
//                 {course.instructor}
//               </p>

//               <div className="mb-4">
//                 <div className="flex justify-between text-sm text-gray-600 mb-2">
//                   <span className="font-medium">Progress</span>
//                   <span className="font-bold text-purple-600">{course.progress}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
//                   <div
//                     className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
//                     style={{ width: `${course.progress}%` }}
//                   ></div>
//                 </div>
//               </div>

//               <div className="flex items-center text-sm text-gray-600 mb-6">
//                 <Calendar className="w-4 h-4 mr-2 text-purple-500" />
//                 {course.nextClass ? (
//                   <span>
//                     Next: {new Date(course.nextClass).toLocaleDateString('en-US', {
//                       weekday: 'short',
//                       month: 'short',
//                       day: 'numeric',
//                     })}
//                   </span>
//                 ) : (
//                   <span>No upcoming class</span>
//                 )}
//               </div>


//               <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
//                 Continue Learning
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // Completed Courses Component
// const CompletedCourses = ({ courses, loading }) => {
//   if (loading) {
//     return (
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {[1, 2].map((i) => <LoadingCard key={i} />)}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="text-2xl font-bold text-gray-800">Completed Courses</h3>
//           <p className="text-gray-600 mt-1">Your achievements and certificates</p>
//         </div>
//         <div className="text-right">
//           <p className="text-3xl font-bold text-green-600">{courses.length}</p>
//           <p className="text-sm text-gray-500">Completed</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {courses.map((course) => (
//           <div key={course.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200">
//             <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"></div>
//             <div className="p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex-1">
//                   <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
//                     {course.title}
//                   </h4>
//                   <p className="text-gray-600 flex items-center">
//                     <User className="w-4 h-4 mr-2 text-green-500" />
//                     {course.instructor}
//                   </p>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <div className="text-right">
//                     <div className="flex items-center space-x-1">
//                       <Award className="w-5 h-5 text-yellow-500" />
//                       <span className="text-2xl font-bold text-green-600">{course.grade}</span>
//                     </div>
//                     {course.rating && (
//                       <div className="flex items-center space-x-1 mt-1">
//                         <Star className="w-4 h-4 text-yellow-400 fill-current" />
//                         <span className="text-sm text-gray-600">{course.rating}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
//                 <span className="flex items-center">
//                   <Calendar className="w-4 h-4 mr-2 text-green-500" />
//                   Completed: {new Date(course.completedDate).toLocaleDateString()}
//                 </span>
//                 {course.certificate && (
//                   <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
//                     ✓ Certified
//                   </span>
//                 )}
//               </div>

//               <div className="flex space-x-3">
//                 <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2">
//                   <Download className="w-4 h-4" />
//                   <span>Certificate</span>
//                 </button>
//                 <button className="px-4 py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-all duration-200 font-semibold">
//                   Review
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // Announcements Component
// const Announcements = ({ announcements, loading }) => {
//   if (loading) {
//     return (
//       <div className="space-y-4">
//         {[1, 2, 3].map((i) => <LoadingCard key={i} />)}
//       </div>
//     );
//   }

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case 'high': return { bg: 'from-red-500 to-pink-500', badge: 'bg-red-100 text-red-800' };
//       case 'medium': return { bg: 'from-yellow-500 to-orange-500', badge: 'bg-yellow-100 text-yellow-800' };
//       default: return { bg: 'from-blue-500 to-indigo-500', badge: 'bg-blue-100 text-blue-800' };
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h3 className="text-2xl font-bold text-gray-800">Latest Announcements</h3>
//         <p className="text-gray-600 mt-1">Stay updated with important notifications</p>
//       </div>

//       <div className="space-y-6">
//         {announcements.map((announcement) => {
//           const colors = getPriorityColor(announcement.priority);
//           return (
//             <div key={announcement.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
//               <div className={`h-2 bg-gradient-to-r ${colors.bg}`}></div>
//               <div className="p-6">
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-3 mb-2">
//                       <h4 className="text-xl font-bold text-gray-800">{announcement.title}</h4>
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${colors.badge}`}>
//                         {announcement.priority}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-500 mb-3">
//                       By {announcement.author} • {new Date(announcement.date).toLocaleDateString('en-US', {
//                         weekday: 'long',
//                         year: 'numeric',
//                         month: 'long',
//                         day: 'numeric'
//                       })}
//                     </p>
//                   </div>
//                 </div>
//                 <p className="text-gray-700 leading-relaxed text-lg">{announcement.content}</p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// // Main Dashboard Component - CHANGED: Added username state and passed to API calls
// export default function StudentDashboard() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState('current');
//   const [currentCourses, setCurrentCourses] = useState([]);
//   const [completedCourses, setCompletedCourses] = useState([]);
//   const [announcements, setAnnouncements] = useState([]);
//   const [loading, setLoading] = useState(false);
//   // CHANGED: Added username state (replace with your actual username logic)
//   const [username] = useState(() => localStorage.getItem('username')); // You can make this dynamic based on login

//   // CHANGED: Updated fetchData to pass username to API calls
//   const fetchData = async (tab) => {
//     setLoading(true);
//     try {
//       switch (tab) {
//         case 'current':
//           const current = await ApiService.getCurrentCourses(username);
//           setCurrentCourses(current);
//           break;
//         case 'completed':
//           const completed = await ApiService.getCompletedCourses(username);
//           setCompletedCourses(completed);
//           break;
//         case 'announcements':
//           const announce = await ApiService.getAnnouncements(username);
//           setAnnouncements(announce);
//           break;
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Load data when component mounts
//   useEffect(() => {
//     fetchData(activeTab);
//   }, [activeTab]);

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     setSidebarOpen(false); // Close sidebar on mobile
//   };

//   const getTitle = () => {
//     switch (activeTab) {
//       case 'current': return 'Current Courses';
//       case 'completed': return 'Completed Courses';
//       case 'announcements': return 'Announcements';
//       default: return 'Dashboard';
//     }
//   };

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'current':
//         return <CurrentCourses courses={currentCourses} loading={loading} />;
//       case 'completed':
//         return <CompletedCourses courses={completedCourses} loading={loading} />;
//       case 'announcements':
//         return <Announcements announcements={announcements} loading={loading} />;
//       default:
//         return <CurrentCourses courses={currentCourses} loading={loading} />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
//       <Sidebar
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//         activeTab={activeTab}
//         onTabChange={handleTabChange}
//       />

//       <div className="lg:ml-72 transition-all duration-300">
//         <Header
//           onMenuClick={() => setSidebarOpen(true)}
//           title={getTitle()}
//         />

//         <main className="p-6 max-w-7xl mx-auto">
//           {renderContent()}
//         </main>
//       </div>
//     </div>
//   );
// }