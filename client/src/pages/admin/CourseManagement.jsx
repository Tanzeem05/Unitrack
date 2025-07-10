// // src/pages/Admin/CourseManagement.jsx
// import { useState } from 'react';

// export default function CourseManagement() {
//   const [courses, setCourses] = useState([]);
//   const [form, setForm] = useState({ code: '', name: '' });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleAddCourse = () => {
//     setCourses([...courses, { ...form, id: Date.now() }]);
//     setForm({ code: '', name: '' });
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-semibold mb-4">Course Management</h1>
//       <div className="flex gap-4 mb-6">
//         <input
//           type="text"
//           name="code"
//           value={form.code}
//           onChange={handleChange}
//           placeholder="Course Code"
//           className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
//         />
//         <input
//           type="text"
//           name="name"
//           value={form.name}
//           onChange={handleChange}
//           placeholder="Course Name"
//           className="p-2 bg-gray-800 text-white border border-gray-600 rounded"
//         />
//         <button onClick={handleAddCourse} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
//           Add Course
//         </button>
//       </div>
//       <ul className="space-y-2">
//         {courses.map((course) => (
//           <li key={course.id} className="border border-gray-600 p-2 rounded">
//             {course.code} - {course.name}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }


// src/pages/Admin/CourseManagement.jsx
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Trash2, Plus, Edit, Calendar, User } from 'lucide-react';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    course_code: '', 
    course_name: '', 
    description: '',
    start_date: '',
    end_date: '',
    created_by: '',
    updated_by: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const username = localStorage.getItem('username'); // Get admin username

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await api('/courses', 'GET');
      if (data.error) {
        setCourses([]);
      } else {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCourse = async () => {
    if (!form.course_code || !form.course_name) {
      alert('Please fill in course code and name');
      return;
    }

    try {
      const courseData = {
        ...form,
        created_by: username,
        updated_by: username
      };

      const result = await api('/', 'POST', courseData);
      
      if (result.error) {
        alert(`Error creating course: ${result.error}`);
      } else {
        alert('Course created successfully!');
        setForm({ 
          course_code: '', 
          course_name: '', 
          description: '',
          start_date: '',
          end_date: '',
          created_by: '',
          updated_by: ''
        });
        fetchCourses(); // Refresh the course list
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course');
    }
  };

  const handleEditCourse = (course) => {
    setForm({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      start_date: course.start_date ? course.start_date.split('T')[0] : '',
      end_date: course.end_date ? course.end_date.split('T')[0] : '',
      created_by: course.created_by,
      updated_by: username
    });
    setIsEditing(true);
    setEditingId(course.course_id);
  };

  const handleUpdateCourse = async () => {
    if (!form.course_code || !form.course_name) {
      alert('Please fill in course code and name');
      return;
    }

    try {
      const courseData = {
        ...form,
        updated_by: username
      };

      const result = await api(`/courses/${editingId}`, 'PUT', courseData);
      
      if (result.error) {
        alert(`Error updating course: ${result.error}`);
      } else {
        alert('Course updated successfully!');
        setForm({ 
          course_code: '', 
          course_name: '', 
          description: '',
          start_date: '',
          end_date: '',
          created_by: '',
          updated_by: ''
        });
        setIsEditing(false);
        setEditingId(null);
        fetchCourses(); // Refresh the course list
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Error updating course');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (window.confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)) {
      try {
        const result = await api(`/courses/${courseId}`, 'DELETE');
        
        if (result.error) {
          alert(`Error deleting course: ${result.error}`);
        } else {
          alert('Course deleted successfully!');
          fetchCourses(); // Refresh the course list
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
      }
    }
  };

  const handleCancelEdit = () => {
    setForm({ 
      course_code: '', 
      course_name: '', 
      description: '',
      start_date: '',
      end_date: '',
      created_by: '',
      updated_by: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
          <p className="text-gray-300 mt-1">Manage all courses in the system</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-400">{courses.length}</p>
          <p className="text-sm text-gray-400">Total Courses</p>
        </div>
      </div>

      {/* Course Form */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-600 border-opacity-30 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isEditing ? 'Edit Course' : 'Add New Course'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            name="course_code"
            value={form.course_code}
            onChange={handleChange}
            placeholder="Course Code (e.g., CS101)"
            className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
          />
          <input
            type="text"
            name="course_name"
            value={form.course_name}
            onChange={handleChange}
            placeholder="Course Name"
            className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Course Description"
            rows="3"
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          {isEditing ? (
            <>
              <button 
                onClick={handleUpdateCourse} 
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Update Course
              </button>
              <button 
                onClick={handleCancelEdit} 
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={handleAddCourse} 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          )}
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">All Courses</h2>
        
        {courses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No courses found. Create your first course above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.course_id} className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-600 border-opacity-30 p-6 hover:border-blue-400 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{course.course_code}</h3>
                    <p className="text-blue-400 font-medium">{course.course_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="p-2 text-blue-400 hover:bg-blue-400 hover:text-white rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.course_id, course.course_name)}
                      className="p-2 text-red-400 hover:bg-red-400 hover:text-white rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {course.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {course.start_date && (
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Start: {new Date(course.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {course.end_date && (
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        End: {new Date(course.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {course.created_by && (
                    <div className="flex items-center text-gray-400">
                      <User className="w-4 h-4 mr-2" />
                      <span>Created by: {course.created_by}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>ID: {course.course_id}</span>
                    {course.updated_at && (
                      <span>Updated: {new Date(course.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
