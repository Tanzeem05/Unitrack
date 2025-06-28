// src/pages/Admin/CourseManagement.jsx
import { useState } from 'react';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: '', name: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCourse = () => {
    setCourses([...courses, { ...form, id: Date.now() }]);
    setForm({ code: '', name: '' });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Course Management</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="Course Code"
          className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Course Name"
          className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
        />
        <button onClick={handleAddCourse} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Add Course
        </button>
      </div>
      <ul className="space-y-2">
        {courses.map((course) => (
          <li key={course.id} className="border border-gray-600 p-2 rounded">
            {course.code} - {course.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
