import { Routes, Route } from 'react-router-dom';
<<<<<<< HEAD
// import GlobalAnnouncements from './Admin/GlobalAnnouncements';
// import UserManagement from './Admin/UserManagement';
// import CourseManagement from './Admin/CourseManagement';
=======
import GlobalAnnouncements from './admin/GlobalAnnouncement';
import UserManagement from './admin/UserManagement';
import CourseManagement from './admin/CourseManagement';
>>>>>>> master
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const navLinks = [
    { to: 'announcements', label: 'Global Announcements' },
    { to: 'users', label: 'User Management' },
    { to: 'courses', label: 'Course Management' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar links={navLinks} title="Admin Panel" />
      <main className="flex-1">
        <Header title="Admin Dashboard" />
        <div className="p-6">
          <Routes>
            <Route path="announcements" element={<GlobalAnnouncements />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="courses" element={<CourseManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
<<<<<<< HEAD
=======


// import { useState } from 'react';
// import { 
//   Users, 
//   BookOpen, 
//   Megaphone, 
//   GraduationCap, 
//   Plus,
//   Edit3,
//   Trash2,
//   Search,
//   Filter,
//   Bell,
//   Settings,
//   Menu,
//   X
// } from 'lucide-react';

// // Sidebar Component
// function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
//   const navLinks = [
//     { id: 'announcements', label: 'Global Announcements', icon: Megaphone },
//     { id: 'users', label: 'User Management', icon: Users },
//     { id: 'courses', label: 'Course Management', icon: BookOpen }
//   ];

//   return (
//     <>
//       {/* Mobile overlay */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//           onClick={onClose}
//         />
//       )}
      
//       {/* Sidebar */}
//       <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
//         <div className="flex items-center justify-between h-16 px-4 border-b border-purple-700">
//           <div className="flex items-center space-x-2">
//             <GraduationCap className="w-8 h-8 text-purple-300" />
//             <h1 className="text-xl font-bold text-white">EduAdmin</h1>
//           </div>
//           <button 
//             onClick={onClose}
//             className="lg:hidden text-purple-300 hover:text-white"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>
        
//         <nav className="mt-8 px-4">
//           <div className="space-y-2">
//             {navLinks.map((link) => {
//               const Icon = link.icon;
//               return (
//                 <button
//                   key={link.id}
//                   onClick={() => {
//                     setActiveTab(link.id);
//                     onClose();
//                   }}
//                   className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
//                     activeTab === link.id
//                       ? 'bg-white bg-opacity-20 text-white shadow-lg'
//                       : 'text-purple-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                   <span className="font-medium">{link.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </nav>
        
//         <div className="absolute bottom-4 left-4 right-4">
//           <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
//                 <span className="text-white font-semibold">A</span>
//               </div>
//               <div>
//                 <p className="text-white font-medium">Admin</p>
//                 <p className="text-purple-300 text-sm">Administrator</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // Header Component
// function Header({ title, onMenuClick }) {
//   return (
//     <header className="bg-white bg-opacity-95 backdrop-blur-sm border-b border-purple-100 h-16">
//       <div className="flex items-center justify-between h-full px-6">
//         <div className="flex items-center space-x-4">
//           <button 
//             onClick={onMenuClick}
//             className="lg:hidden text-purple-600 hover:text-purple-800"
//           >
//             <Menu className="w-6 h-6" />
//           </button>
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
//             {title}
//           </h1>
//         </div>
        
//         <div className="flex items-center space-x-4">
//           <button className="relative p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
//             <Bell className="w-5 h-5" />
//             <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></span>
//           </button>
//           <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
//             <Settings className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

// // Global Announcements Component
// function GlobalAnnouncements() {
//   const [announcements, setAnnouncements] = useState([]);
//   const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });
//   const [searchTerm, setSearchTerm] = useState('');

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (form.title.trim() && form.content.trim()) {
//       setAnnouncements((prev) => [...prev, { 
//         ...form, 
//         id: Date.now(),
//         date: new Date().toLocaleDateString(),
//         time: new Date().toLocaleTimeString()
//       }]);
//       setForm({ title: '', content: '', priority: 'normal' });
//     }
//   };

//   const handleDelete = (id) => {
//     setAnnouncements(prev => prev.filter(a => a.id !== id));
//   };

//   const filteredAnnouncements = announcements.filter(a => 
//     a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     a.content.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const getPriorityColor = (priority) => {
//     switch(priority) {
//       case 'high': return 'border-red-400 bg-red-50';
//       case 'medium': return 'border-yellow-400 bg-yellow-50';
//       default: return 'border-purple-400 bg-purple-50';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800">Global Announcements</h2>
//           <p className="text-gray-600 mt-1">Share important updates with your educational community</p>
//         </div>
//         <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg">
//           <span className="font-semibold">{announcements.length}</span> Active
//         </div>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//         <input
//           type="text"
//           placeholder="Search announcements..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="w-full pl-10 pr-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//         />
//       </div>

//       {/* Add Announcement Form */}
//       <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
//         <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
//           <Plus className="w-5 h-5 mr-2 text-purple-600" />
//           Create New Announcement
//         </h3>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="md:col-span-2">
//               <input
//                 type="text"
//                 name="title"
//                 value={form.title}
//                 onChange={handleChange}
//                 placeholder="Announcement title..."
//                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//                 required
//               />
//             </div>
//             <select
//               name="priority"
//               value={form.priority}
//               onChange={handleChange}
//               className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//             >
//               <option value="normal">Normal Priority</option>
//               <option value="medium">Medium Priority</option>
//               <option value="high">High Priority</option>
//             </select>
//           </div>
//           <textarea
//             name="content"
//             value={form.content}
//             onChange={handleChange}
//             placeholder="Write your announcement content here..."
//             rows="4"
//             className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
//             required
//           />
//           <button 
//             type="submit" 
//             className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg"
//           >
//             Publish Announcement
//           </button>
//         </form>
//       </div>

//       {/* Announcements List */}
//       <div className="space-y-4">
//         {filteredAnnouncements.length === 0 ? (
//           <div className="text-center py-12 bg-white rounded-2xl border border-purple-100">
//             <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-500 text-lg">No announcements yet</p>
//             <p className="text-gray-400">Create your first announcement to get started!</p>
//           </div>
//         ) : (
//           filteredAnnouncements.map((announcement) => (
//             <div key={announcement.id} className={`bg-white rounded-2xl shadow-lg border-l-4 p-6 ${getPriorityColor(announcement.priority)}`}>
//               <div className="flex justify-between items-start mb-3">
//                 <h3 className="text-xl font-semibold text-gray-800">{announcement.title}</h3>
//                 <div className="flex items-center space-x-2">
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                     announcement.priority === 'high' ? 'bg-red-100 text-red-700' :
//                     announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
//                     'bg-purple-100 text-purple-700'
//                   }`}>
//                     {announcement.priority} priority
//                   </span>
//                   <button className="text-gray-400 hover:text-purple-600 p-1">
//                     <Edit3 className="w-4 h-4" />
//                   </button>
//                   <button 
//                     onClick={() => handleDelete(announcement.id)}
//                     className="text-gray-400 hover:text-red-600 p-1"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//               <p className="text-gray-700 mb-4 leading-relaxed">{announcement.content}</p>
//               <div className="flex items-center text-sm text-gray-500">
//                 <span>Published on {announcement.date} at {announcement.time}</span>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// // User Management Component
// function UserManagement() {
//   const [users, setUsers] = useState([]);
//   const [form, setForm] = useState({ username: '', user_type: 'student', email: '' });
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterType, setFilterType] = useState('all');

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleAddUser = () => {
//     if (form.username.trim()) {
//       const newUser = { 
//         ...form, 
//         id: Date.now(),
//         status: 'active',
//         joinDate: new Date().toLocaleDateString()
//       };
//       setUsers([...users, newUser]);
//       setForm({ username: '', user_type: 'student', email: '' });
//     }
//   };

//   const handleDeleteUser = (id) => {
//     setUsers(prev => prev.filter(u => u.id !== id));
//   };

//   const filteredUsers = users.filter(user => {
//     const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterType === 'all' || user.user_type === filterType;
//     return matchesSearch && matchesFilter;
//   });

//   const getUserTypeColor = (type) => {
//     switch(type) {
//       case 'admin': return 'bg-red-100 text-red-700';
//       case 'teacher': return 'bg-blue-100 text-blue-700';
//       default: return 'bg-green-100 text-green-700';
//     }
//   };

//   const getUserTypeIcon = (type) => {
//     switch(type) {
//       case 'admin': return '👑';
//       case 'teacher': return '🎓';
//       default: return '👨‍🎓';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
//           <p className="text-gray-600 mt-1">Manage students, teachers, and administrators</p>
//         </div>
//         <div className="flex space-x-4">
//           <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg">
//             <span className="font-semibold">{users.filter(u => u.user_type === 'student').length}</span> Students
//           </div>
//           <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg">
//             <span className="font-semibold">{users.filter(u => u.user_type === 'teacher').length}</span> Teachers
//           </div>
//         </div>
//       </div>

//       {/* Search and Filter */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input
//             type="text"
//             placeholder="Search users..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           />
//         </div>
//         <div className="relative">
//           <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <select
//             value={filterType}
//             onChange={(e) => setFilterType(e.target.value)}
//             className="pl-10 pr-8 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           >
//             <option value="all">All Users</option>
//             <option value="student">Students</option>
//             <option value="teacher">Teachers</option>
//             <option value="admin">Admins</option>
//           </select>
//         </div>
//       </div>

//       {/* Add User Form */}
//       <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
//         <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
//           <Plus className="w-5 h-5 mr-2 text-purple-600" />
//           Add New User
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <input
//             type="text"
//             name="username"
//             value={form.username}
//             onChange={handleChange}
//             placeholder="Username"
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//             required
//           />
//           <input
//             type="email"
//             name="email"
//             value={form.email}
//             onChange={handleChange}
//             placeholder="Email address"
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           />
//           <select
//             name="user_type"
//             value={form.user_type}
//             onChange={handleChange}
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           >
//             <option value="student">Student</option>
//             <option value="teacher">Teacher</option>
//             <option value="admin">Admin</option>
//           </select>
//           <button 
//             onClick={handleAddUser} 
//             className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold shadow-lg"
//           >
//             Add User
//           </button>
//         </div>
//       </div>

//       {/* Users List */}
//       <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
//         {filteredUsers.length === 0 ? (
//           <div className="text-center py-12">
//             <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-500 text-lg">No users found</p>
//             <p className="text-gray-400">Add your first user to get started!</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Join Date</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
//                   <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {filteredUsers.map((user) => (
//                   <tr key={user.id} className="hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4">
//                       <div className="flex items-center space-x-3">
//                         <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
//                           {user.username.charAt(0).toUpperCase()}
//                         </div>
//                         <span className="font-medium text-gray-800">{user.username}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(user.user_type)}`}>
//                         <span className="mr-1">{getUserTypeIcon(user.user_type)}</span>
//                         {user.user_type}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-gray-600">{user.email || 'Not provided'}</td>
//                     <td className="px-6 py-4 text-gray-600">{user.joinDate}</td>
//                     <td className="px-6 py-4">
//                       <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
//                         Active
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex space-x-2">
//                         <button className="text-gray-400 hover:text-purple-600 p-1">
//                           <Edit3 className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="text-gray-400 hover:text-red-600 p-1"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Course Management Component
// function CourseManagement() {
//   const [courses, setCourses] = useState([]);
//   const [form, setForm] = useState({ code: '', name: '', description: '', credits: '3' });
//   const [searchTerm, setSearchTerm] = useState('');

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleAddCourse = () => {
//     if (form.code.trim() && form.name.trim()) {
//       setCourses([...courses, { 
//         ...form, 
//         id: Date.now(),
//         students: Math.floor(Math.random() * 50) + 10,
//         status: 'active'
//       }]);
//       setForm({ code: '', name: '', description: '', credits: '3' });
//     }
//   };

//   const handleDeleteCourse = (id) => {
//     setCourses(prev => prev.filter(c => c.id !== id));
//   };

//   const filteredCourses = courses.filter(course => 
//     course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     course.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold text-gray-800">Course Management</h2>
//           <p className="text-gray-600 mt-1">Organize and manage your educational courses</p>
//         </div>
//         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg">
//           <span className="font-semibold">{courses.length}</span> Courses
//         </div>
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//         <input
//           type="text"
//           placeholder="Search courses..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="w-full pl-10 pr-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//         />
//       </div>

//       {/* Add Course Form */}
//       <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
//         <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
//           <Plus className="w-5 h-5 mr-2 text-purple-600" />
//           Add New Course
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           <input
//             type="text"
//             name="code"
//             value={form.code}
//             onChange={handleChange}
//             placeholder="Course Code (e.g., CS101)"
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//             required
//           />
//           <input
//             type="text"
//             name="name"
//             value={form.name}
//             onChange={handleChange}
//             placeholder="Course Name"
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//             required
//           />
//           <input
//             type="text"
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//             placeholder="Description"
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           />
//           <select
//             name="credits"
//             value={form.credits}
//             onChange={handleChange}
//             className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//           >
//             <option value="1">1 Credit</option>
//             <option value="2">2 Credits</option>
//             <option value="3">3 Credits</option>
//             <option value="4">4 Credits</option>
//             <option value="5">5 Credits</option>
//           </select>
//           <button 
//             onClick={handleAddCourse} 
//             className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
//           >
//             Add Course
//           </button>
//         </div>
//       </div>

//       {/* Courses Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredCourses.length === 0 ? (
//           <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-purple-100">
//             <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-500 text-lg">No courses available</p>
//             <p className="text-gray-400">Create your first course to get started!</p>
//           </div>
//         ) : (
//           filteredCourses.map((course) => (
//             <div key={course.id} className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-200">
//               <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2"></div>
//               <div className="p-6">
//                 <div className="flex justify-between items-start mb-3">
//                   <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
//                     {course.code}
//                   </div>
//                   <div className="flex space-x-2">
//                     <button className="text-gray-400 hover:text-purple-600 p-1">
//                       <Edit3 className="w-4 h-4" />
//                     </button>
//                     <button 
//                       onClick={() => handleDeleteCourse(course.id)}
//                       className="text-gray-400 hover:text-red-600 p-1"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
                
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.name}</h3>
                
//                 {course.description && (
//                   <p className="text-gray-600 mb-4 text-sm leading-relaxed">{course.description}</p>
//                 )}
                
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-4">
//                     <div className="flex items-center text-sm text-gray-500">
//                       <Users className="w-4 h-4 mr-1" />
//                       <span>{





>>>>>>> master
