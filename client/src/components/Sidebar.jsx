import { NavLink } from 'react-router-dom';

export default function Sidebar({ links = [], title = "Navigation" }) {
  return (
    <aside className="w-64 bg-gray-800 p-4">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <nav className="flex flex-col gap-4">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'text-blue-400' : ''}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}