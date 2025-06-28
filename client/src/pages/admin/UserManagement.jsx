// src/pages/Admin/UserManagement.jsx
import { useState } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', user_type: 'student' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUser = () => {
    const newUser = { ...form, id: Date.now() };
    setUsers([...users, newUser]);
    setForm({ username: '', user_type: 'student' });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">User Management</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Username"
          className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <select
          name="user_type"
          value={form.user_type}
          onChange={handleChange}
          className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleAddUser} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
          Add User
        </button>
      </div>
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} className="border border-gray-600 p-2 rounded">
            {user.username} - <span className="text-gray-400">{user.user_type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}