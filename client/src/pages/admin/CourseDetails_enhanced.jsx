import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from './components/Modal';

const CourseDetails = ({ course, onBack }) => {
  const [courseStats, setCourseStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    students: [],
    teachers: []
  });
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ sessions: [], departments: [] });
  const [studentFilters, setStudentFilters] = useState({ session: '', department: '', search: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      fetchCourseDetails();
      fetchAvailableStudents();
      fetchAvailableTeachers();
      fetchFilterOptions();
    }
  }, [course]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled students
      const studentsResponse = await api(`/courses/${course.course_id}/students`);
      const students = studentsResponse.slice(0, 5); // Limit to 5
      
      // Fetch assigned teachers
      const teachersResponse = await api(`/courses/${course.course_id}/teachers`);
      const teachers = teachersResponse.slice(0, 5); // Limit to 5
      
      setCourseStats({
        studentCount: studentsResponse.length,
        teacherCount: teachersResponse.length,
        students: students,
        teachers: teachers
      });
      
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.session) queryParams.append('session', filters.session);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.search) queryParams.append('search', filters.search);
      
      const url = `/courses/${course.course_id}/available-students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api(url);
      setAllStudents(response);
      setFilteredStudents(response);
    } catch (error) {
      console.error('Error fetching available students:', error);
      // Fallback: get all students
      try {
        const allStudentsResponse = await api('/users?user_type=student');
        setAllStudents(allStudentsResponse);
        setFilteredStudents(allStudentsResponse);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await api(`/courses/${course.course_id}/student-filter-options`);
      setFilterOptions(response);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      // Get all teachers not assigned to this course
      const response = await api(`/courses/${course.course_id}/available-teachers`);
      setAllTeachers(response);
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      // Fallback: get all teachers
      try {
        const allTeachersResponse = await api('/users?user_type=teacher');
        setAllTeachers(allTeachersResponse);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...studentFilters, [filterType]: value };
    setStudentFilters(newFilters);
    fetchAvailableStudents(newFilters);
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSearchTermChange = (value) => {
    setSearchTerm(value);
    if (value.trim().length > 0) {
      const filtered = filteredStudents.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(value.toLowerCase()) ||
        student.email.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      setSelectedStudent('');
    }
  };

  const handleSuggestionSelect = (student) => {
    setSearchTerm(`${student.first_name} ${student.last_name}`);
    setSelectedStudent(student.user_id);
    setShowSuggestions(false);
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const promises = selectedStudents.map(studentId =>
        api(`/enrollment/${course.course_id}/enroll-student`, 'POST', {
          student_id: parseInt(studentId)
        })
      );
      
      await Promise.all(promises);
      
      setMessage({ text: `${selectedStudents.length} students assigned successfully!`, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowAssignStudentModal(false);
      setSelectedStudents([]);
      setBulkAssignMode(false);
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableStudents(studentFilters);
    } catch (error) {
      console.error('Error assigning students:', error);
      setMessage({ text: 'Failed to assign students', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    try {
      await api(`/enrollment/${course.course_id}/enroll-student`, 'POST', {
        student_id: parseInt(selectedStudent)
      });
      
      setMessage({ text: 'Student assigned successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowAssignStudentModal(false);
      setSelectedStudent('');
      setSearchTerm('');
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableStudents(studentFilters);
    } catch (error) {
      console.error('Error assigning student:', error);
      setMessage({ text: 'Failed to assign student', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    
    setIsSubmitting(true);
    try {
      await api(`/course-teachers/${course.course_id}/assign-teacher`, 'POST', {
        teacher_id: parseInt(selectedTeacher)
      });
      
      setMessage({ text: 'Teacher assigned successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowAssignTeacherModal(false);
      setSelectedTeacher('');
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableTeachers();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      setMessage({ text: 'Failed to assign teacher', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2"
          >
            ← Back to Courses
          </button>
          <h1 className="text-3xl font-bold">{course.course_code} - {course.course_name}</h1>
          <p className="text-gray-400 mt-2">{course.description}</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {message.text}
        </div>
      )}

      {/* Course Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Students Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Students ({courseStats.studentCount})</h2>
            <button
              onClick={() => setShowAssignStudentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Assign Student
            </button>
          </div>
          <div className="space-y-3">
            {courseStats.students.length > 0 ? (
              courseStats.students.map((student) => (
                <div key={student.user_id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm">{student.first_name} {student.last_name}</p>
                    <p className="text-gray-400 text-xs">{student.email}</p>
                    {student.batch_year && (
                      <p className="text-blue-300 text-xs">Batch {student.batch_year}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No students enrolled</p>
            )}
            {courseStats.studentCount > 5 && (
              <p className="text-gray-400 text-xs">... and {courseStats.studentCount - 5} more students</p>
            )}
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Teachers ({courseStats.teacherCount})</h2>
            <button
              onClick={() => setShowAssignTeacherModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Assign Teacher
            </button>
          </div>
          <div className="space-y-3">
            {courseStats.teachers.length > 0 ? (
              courseStats.teachers.map((teacher) => (
                <div key={teacher.user_id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm">{teacher.first_name} {teacher.last_name}</p>
                    <p className="text-gray-400 text-xs">{teacher.email}</p>
                    {teacher.specialization && (
                      <p className="text-blue-300 text-xs">{teacher.specialization}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No teachers assigned</p>
            )}
            {courseStats.teacherCount > 5 && (
              <p className="text-gray-400 text-xs">... and {courseStats.teacherCount - 5} more teachers</p>
            )}
          </div>
        </div>
      </div>

      {/* Assign Student Modal */}
      <Modal show={showAssignStudentModal} size="lg" onClose={() => {
        setShowAssignStudentModal(false);
        setSelectedStudent('');
        setSelectedStudents([]);
        setBulkAssignMode(false);
        setStudentFilters({ session: '', department: '', search: '' });
        setSearchTerm('');
        setShowSuggestions(false);
      }} title="Assign Students to Course">
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBulkAssignMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${!bulkAssignMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Single Assignment
            </button>
            <button
              type="button"
              onClick={() => setBulkAssignMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${bulkAssignMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Bulk Assignment
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Session (Batch Year)</label>
              <select
                value={studentFilters.session}
                onChange={(e) => handleFilterChange('session', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sessions</option>
                {filterOptions.sessions.map((session) => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Department</label>
              <select
                value={studentFilters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {filterOptions.departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Search Student</label>
              <input
                type="text"
                value={studentFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Name or email..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!bulkAssignMode ? (
            /* Single Assignment Mode */
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm font-medium mb-2">Search and Select Student</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  placeholder="Type student name or email..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((student) => (
                      <button
                        key={student.user_id}
                        type="button"
                        onClick={() => handleSuggestionSelect(student)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-gray-400 text-xs">{student.email} • {student.department} • Batch {student.batch_year}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !selectedStudent}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    'Assign Student'
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAssignStudentModal(false);
                    setSelectedStudent('');
                    setSearchTerm('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Bulk Assignment Mode */
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-gray-300 text-sm font-medium">Select Students ({selectedStudents.length} selected)</label>
                  <button
                    type="button"
                    onClick={() => setSelectedStudents([])}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg p-3 space-y-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-gray-400 text-sm">No students found with current filters</p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.user_id} className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.user_id)}
                          onChange={() => handleStudentSelection(student.user_id)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm">{student.first_name} {student.last_name}</p>
                          <p className="text-gray-400 text-xs">{student.email} • {student.department} • Batch {student.batch_year}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={isSubmitting || selectedStudents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    `Assign ${selectedStudents.length} Students`
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAssignStudentModal(false);
                    setSelectedStudents([]);
                    setBulkAssignMode(false);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal show={showAssignTeacherModal} onClose={() => setShowAssignTeacherModal(false)} title="Assign Teacher to Course">
        <form onSubmit={handleAssignTeacher} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a teacher...</option>
              {allTeachers.map((teacher) => (
                <option key={teacher.user_id} value={teacher.user_id}>
                  {teacher.first_name} {teacher.last_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedTeacher}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </>
              ) : (
                'Assign Teacher'
              )}
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowAssignTeacherModal(false);
                setSelectedTeacher('');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseDetails;
