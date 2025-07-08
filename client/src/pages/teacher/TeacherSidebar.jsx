import { BookOpen, CheckCircle, Bell, MessageSquare, User, LogOut, GraduationCap, X } from 'lucide-react';

const TeacherSidebar = ({ isOpen, onClose, activeTab, onTabChange }) => {
  const navItems = [
    { id: 'courses', label: 'My Courses', icon: BookOpen, count: 0 }, // Count can be dynamic
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: 0 }, // Count can be dynamic
    { id: 'announcements', label: 'Global Announcements', icon: Bell, count: 0 } // Count can be dynamic
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 transform transition-all duration-300 ease-in-out z-50 lg:translate-x-0 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-purple-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">UniPortal</h1>
                <p className="text-purple-300 text-sm">Teacher Dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-purple-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                  ? 'bg-purple-700 text-white shadow-lg transform scale-105'
                  : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${activeTab === item.id ? 'bg-purple-600' : 'bg-purple-700 group-hover:bg-purple-600'
                    }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-700/50">
          <div className="flex items-center space-x-3 p-4 rounded-xl bg-purple-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-purple-300">Teacher</p>
            </div>
            <button className="text-purple-300 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSidebar;
