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
  const [allTeachers, setAllTeachers] = useState([]);
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
      setMessage({ text: 'Error loading course details', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      // Get all students not enrolled in this course
      const response = await api(`/courses/${course.course_id}/available-students`);
      setAllStudents(response);
    } catch (error) {
      console.error('Error fetching available students:', error);
      // Fallback: get all students
      try {
        const allStudentsResponse = await api('/users?user_type=student');
        setAllStudents(allStudentsResponse);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
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
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableStudents();
      
    } catch (error) {
      console.error('Error assigning student:', error);
      setMessage({ text: 'Error assigning student: ' + error.message, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
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
      setMessage({ text: 'Error assigning teacher: ' + error.message, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          ← Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-white">Course Details</h1>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-400' 
            : 'bg-red-500 bg-opacity-20 border-red-500 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage({ text: '', type: '' })}
              className="ml-auto text-current hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Course Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Course Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-400">{course.course_code}</h3>
            <p className="text-white text-xl mt-1">{course.course_name}</p>
            <p className="text-gray-300 mt-2">{course.description}</p>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Start Date: </span>
              <span className="text-white">{formatDate(course.start_date)}</span>
            </div>
            <div>
              <span className="text-gray-400">End Date: </span>
              <span className="text-white">{formatDate(course.end_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Students</h3>
              <p className="text-3xl font-bold text-blue-400">{courseStats.studentCount}</p>
            </div>
            <button
              onClick={() => setShowAssignStudentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              + Assign Student
            </button>
          </div>
          
          <div className="space-y-2">
            {courseStats.students.length > 0 ? (
              courseStats.students.map((student, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm">{student.first_name} {student.last_name}</p>
                    <p className="text-gray-400 text-xs">{student.email}</p>
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

        {/* Teachers Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Teachers</h3>
              <p className="text-3xl font-bold text-green-400">{courseStats.teacherCount}</p>
            </div>
            <button
              onClick={() => setShowAssignTeacherModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              + Assign Teacher
            </button>
          </div>
          
          <div className="space-y-2">
            {courseStats.teachers.length > 0 ? (
              courseStats.teachers.map((teacher, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
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
      <Modal show={showAssignStudentModal} onClose={() => setShowAssignStudentModal(false)} title="Assign Student to Course">
        <form onSubmit={handleAssignStudent} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Select Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a student...</option>
              {allStudents.map((student) => (
                <option key={student.user_id} value={student.user_id}>
                  {student.first_name} {student.last_name} ({student.email})
                </option>
              ))}
            </select>
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
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal show={showAssignTeacherModal} onClose={() => setShowAssignTeacherModal(false)} title="Assign Teacher to Course">
        <form onSubmit={handleAssignTeacher} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Choose a teacher...</option>
              {allTeachers.map((teacher) => (
                <option key={teacher.user_id} value={teacher.user_id}>
                  {teacher.first_name} {teacher.last_name} ({teacher.specialization})
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
