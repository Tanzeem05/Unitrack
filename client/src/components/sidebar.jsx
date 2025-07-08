import { NavLink } from 'react-router-dom';

export default function Sidebar({ links = [], title = "Navigation" }) {
  return (
    <aside className="w-64 bg-purple-900 bg-opacity-20 backdrop-blur-lg p-4 border-r border-purple-400 border-opacity-30">
      <h2 className="text-2xl font-bold mb-6 text-white">
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>
      <nav className="flex flex-col gap-4">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-purple-700 text-white shadow-lg transform scale-105'
                  : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}