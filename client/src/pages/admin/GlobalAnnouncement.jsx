// src/pages/Admin/GlobalAnnouncements.jsx
import { useState } from 'react';

export default function GlobalAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAnnouncements((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm({ title: '', content: '' });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Global Announcements</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Content"
          rows="4"
          className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Post Announcement
        </button>
      </form>
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="border border-gray-600 p-4 rounded">
            <h2 className="text-xl font-bold">{a.title}</h2>
            <p>{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}