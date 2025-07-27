// import { NavLink } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { User, LogOut, ChevronUp } from 'lucide-react';
// import { useState } from 'react';

// export default function Sidebar({ links = [], title = "Navigation" }) {
//   const { user, logout } = useAuth();
//   const [showLogoutMenu, setShowLogoutMenu] = useState(false);

//   const handleLogout = () => {
//     console.log('Student logout initiated'); // Debug log
//     setShowLogoutMenu(false);
//     logout();
//   };

//   return (
//     <aside className="w-64 bg-purple-1800 bg-opacity-20 backdrop-blur-lg border-r border-purple-400 border-opacity-30 flex flex-col">
//       <div className="p-4 flex-1">
//         <h2 className="text-3xl font-bold mb-10 text-white">
//           <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//              <div>
//                 <h1 className="text-xl font-bold text-white">UniPortal</h1>
//                 <p className="text-purple-300 text-sm">Student Dashboard</p>
//               </div>
            
//           </span>
//         </h2>
//         <nav className="flex flex-col gap-4">
//           {links.map(({ to, label, badge }) => (
//             <NavLink
//               key={to}
//               to={to}
//               end={to === '/student'} 
//               className={({ isActive }) =>
//                 `px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-between ${
//                   isActive
//                     ? 'bg-purple-700 text-white shadow-lg transform scale-105'
//                     : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
//                 }`
//               }
//             >
//               <span>{label}</span>
//               {badge && badge > 0 && (
//                 <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
//                   {badge > 99 ? '99+' : badge}
//                 </span>
//               )}
//             </NavLink>
//           ))}
//         </nav>
//       </div>
      
//       {/* User Profile Section */}
//       <div className="p-4 border-t border-purple-700/50">
//         <div className="relative">
//           {/* Logout confirmation dropdown */}
//           {showLogoutMenu && (
//             <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50">
//               <div className="p-4">
//                 <p className="text-white text-sm mb-3">Are you sure you want to log out?</p>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={handleLogout}
//                     className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded transition-colors"
//                   >
//                     Yes, Logout
//                   </button>
//                   <button
//                     onClick={() => setShowLogoutMenu(false)}
//                     className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-800/50 backdrop-blur-sm">
//             <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
//               <User className="w-5 h-5 text-white" />
//             </div>
//             <NavLink 
//               to="/student/profile"
//               className="flex-1 cursor-pointer hover:bg-purple-700/30 rounded-lg p-1 transition-colors"
//               onClick={() => setShowLogoutMenu(false)}
//             >
//               <p className="text-sm font-medium text-white">
//                 {user?.first_name && user?.last_name 
//                   ? `${user.first_name} ${user.last_name}` 
//                   : user?.username || 'User'}
//               </p>
//               <p className="text-xs text-purple-300">{user?.major || 'Computer Science'}</p>
//             </NavLink>
//             <button 
//               onClick={() => setShowLogoutMenu(!showLogoutMenu)}
//               className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-purple-700/50 rounded-lg"
//               title="Logout"
//             >
//               {showLogoutMenu ? <ChevronUp className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
//             </button>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }


import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ChevronUp, GraduationCap } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ links = [], title = "Navigation" }) {
  const { user, logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = () => {
    console.log('Student logout initiated'); // Debug log
    setShowLogoutMenu(false);
    logout();
  };

  return (
    <aside className="w-72 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-2xl flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-purple-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">UniPortal</h1>
            <p className="text-purple-300 text-sm">Student Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="p-4 flex-1">
        <nav className="space-y-2">
          {links.map(({ to, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/student'} 
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-lg transform scale-105'
                    : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
                }`
              }
            >
              <span className="font-medium">{label}</span>
              {badge && badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-purple-700/50">
        <div className="relative">
          {/* Logout confirmation dropdown */}
          {showLogoutMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg border border-gray-600 shadow-xl z-50">
              <div className="p-4">
                <p className="text-white text-sm mb-3">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    Yes, Logout
                  </button>
                  <button
                    onClick={() => setShowLogoutMenu(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-purple-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <NavLink 
              to="/student/profile"
              className="flex-1 cursor-pointer hover:bg-purple-700/30 rounded-lg p-1 transition-colors"
              onClick={() => setShowLogoutMenu(false)}
            >
              <p className="text-sm font-medium text-white">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.username || 'User'}
              </p>
              <p className="text-xs text-purple-300">{user?.major || 'Computer Science'}</p>
            </NavLink>
            <button 
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-purple-700/50 rounded-lg"
              title="Logout"
            >
              {showLogoutMenu ? <ChevronUp className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}