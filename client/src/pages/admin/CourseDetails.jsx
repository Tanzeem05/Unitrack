import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import Modal from './components/Modal';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    students: [],
    teachers: []
  });
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ sessions: [], departments: [] });
  const [studentFilters, setStudentFilters] = useState({ session: '', department_id: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remove student modal state
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  
  // Remove teacher modal state
  const [showRemoveTeacherModal, setShowRemoveTeacherModal] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState(null);
  
  // Pagination state
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const [currentTeacherPage, setCurrentTeacherPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination utility functions
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // Helper function to check if course is completed
  const isCourseCompleted = () => {
    if (!course) return false;
    
    // Check if end date has passed
    if (course.end_date) {
      const endDate = new Date(course.end_date);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to compare only dates
      return endDate < currentDate;
    }
    
    return false;
  };

  const handlePageChange = (page, type) => {
    if (type === 'students') {
      setCurrentStudentPage(page);
    } else if (type === 'teachers') {
      setCurrentTeacherPage(page);
    }
  };

  // Get paginated data
  const paginatedStudents = getPaginatedItems(courseStats.students, currentStudentPage);
  const paginatedTeachers = getPaginatedItems(courseStats.teachers, currentTeacherPage);
  const totalStudentPages = getTotalPages(courseStats.students);
  const totalTeacherPages = getTotalPages(courseStats.teachers);

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, type }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
        <div className="text-sm text-gray-400">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, type === 'students' ? courseStats.students.length : courseStats.teachers.length)} of {type === 'students' ? courseStats.students.length : courseStats.teachers.length} {type}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1, type)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
          >
            Previous
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1, type)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number, type)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentPage === number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
              <button
                onClick={() => onPageChange(totalPages, type)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => onPageChange(currentPage + 1, type)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Initial load of course data
  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Load related data after course is loaded
  useEffect(() => {
    if (course) {
      fetchCourseDetails();
      fetchAvailableStudents();
      fetchAvailableTeachers();
      fetchFilterOptions();
    }
  }, [course]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const courseData = await api(`/courses/course/${courseId}`);
      setCourse(courseData);
    } catch (error) {
      console.error('Error fetching course:', error);
      // If course not found, redirect back to courses list
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Update displayed students when filtered students change
    setDisplayedStudents(filteredStudents);
    setBulkSearchTerm(''); // Reset search when filters change
  }, [filteredStudents]);

  useEffect(() => {
    // When modal opens, load all students for single assignment mode
    if (showAssignStudentModal) {
      fetchAvailableStudents(); // Load all students without filters initially
    }
  }, [showAssignStudentModal]);

  useEffect(() => {
    // Handle click outside to close teacher suggestions
    const handleClickOutside = (event) => {
      if (showTeacherSuggestions && !event.target.closest('.teacher-search-container')) {
        setShowTeacherSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTeacherSuggestions]);

  // Reset pagination when courseStats changes
  useEffect(() => {
    setCurrentStudentPage(1);
    setCurrentTeacherPage(1);
  }, [courseStats.students.length, courseStats.teachers.length]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled students
      const studentsResponse = await api(`/courses/${course.course_id}/students`);
      
      // Fetch assigned teachers
      const teachersResponse = await api(`/courses/${course.course_id}/teachers`);
      
      setCourseStats({
        studentCount: studentsResponse.length,
        teacherCount: teachersResponse.length,
        students: studentsResponse, // Store all students for pagination
        teachers: teachersResponse  // Store all teachers for pagination
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
      if (filters.department_id) queryParams.append('department_id', filters.department_id);
      
      const url = `/courses/${course.course_id}/available-students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api(url);
      setAllStudents(response);
      setFilteredStudents(response);
      setDisplayedStudents(response);
    } catch (error) {
      console.error('Error fetching available students:', error);
      // Fallback: get all students
      try {
        const allStudentsResponse = await api('/users?user_type=student');
        setAllStudents(allStudentsResponse);
        setFilteredStudents(allStudentsResponse);
        setDisplayedStudents(allStudentsResponse);
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
      setFilteredTeachers(response); // Initialize filtered teachers
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      // Fallback: get all teachers
      try {
        const allTeachersResponse = await api('/users?user_type=teacher');
        setAllTeachers(allTeachersResponse);
        setFilteredTeachers(allTeachersResponse); // Initialize filtered teachers
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const handleTeacherSearch = (searchValue) => {
    setTeacherSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      setFilteredTeachers(allTeachers);
      setShowTeacherSuggestions(false);
    } else {
      const filtered = allTeachers.filter(teacher =>
        `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchValue.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        teacher.username?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredTeachers(filtered);
      setShowTeacherSuggestions(true);
    }
  };

  const selectTeacherFromSearch = (teacher) => {
    setSelectedTeacher(teacher.user_id);
    setTeacherSearchTerm(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
    setShowTeacherSuggestions(false);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...studentFilters, [filterType]: value };
    setStudentFilters(newFilters);
    
    if (bulkAssignMode) {
      // In bulk mode, fetch students based on filters
      fetchAvailableStudents(newFilters);
      // Reset selections when filters change
      setSelectedStudents([]);
    } else {
      // In single mode, just update the filter state
      // The search will apply these filters dynamically
      setSelectedStudent('');
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  // Auto-select all students when filtered students change in bulk mode
  useEffect(() => {
    if (bulkAssignMode && filteredStudents.length > 0) {
      // Auto-check only non-enrolled students
      const availableStudentIds = filteredStudents
        .filter(student => !student.is_enrolled)
        .map(student => student.user_id);
      setSelectedStudents(availableStudentIds);
    }
  }, [filteredStudents, bulkAssignMode]);

  const handleBulkSearchChange = (value) => {
    setBulkSearchTerm(value);
    if (value.trim().length > 0) {
      const filtered = filteredStudents.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(value.toLowerCase()) ||
        student.email.toLowerCase().includes(value.toLowerCase())
      );
      setDisplayedStudents(filtered);
    } else {
      setDisplayedStudents(filteredStudents);
    }
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
      // Start with all available students
      let studentsToSearch = allStudents;
      
      // Apply session filter if selected
      if (studentFilters.session) {
        studentsToSearch = studentsToSearch.filter(student => 
          student.batch_year && student.batch_year.toString() === studentFilters.session.toString()
        );
      }
      
      // Apply department filter if selected
      if (studentFilters.department_id) {
        studentsToSearch = studentsToSearch.filter(student => 
          student.department_id && student.department_id.toString() === studentFilters.department_id.toString()
        );
      }
      
      // Apply search filter
      const filtered = studentsToSearch.filter(student =>
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
    if (student.is_enrolled) return; // Prevent selection of enrolled students
    
    setSearchTerm(`${student.first_name} ${student.last_name}`);
    setSelectedStudent(student.user_id);
    setShowSuggestions(false);
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) return;
    
    // Check if course is completed
    if (isCourseCompleted()) {
      setMessage({ text: 'Cannot assign students to a completed course', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    // Filter out any enrolled students from selection (safety check)
    const availableStudentsToAssign = selectedStudents.filter(studentId => {
      const student = displayedStudents.find(s => s.user_id === studentId);
      return student && !student.is_enrolled;
    });
    
    if (availableStudentsToAssign.length === 0) {
      setMessage({ text: 'No available students selected for assignment', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const promises = availableStudentsToAssign.map(studentId =>
        api(`/enrollment/${course.course_id}/enroll-student`, 'POST', {
          student_id: parseInt(studentId)
        })
      );
      
      await Promise.all(promises);
      
      setMessage({ text: `${availableStudentsToAssign.length} students assigned successfully!`, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowAssignStudentModal(false);
      setSelectedStudents([]);
      setBulkAssignMode(false);
      setStudentFilters({ session: '', department_id: '' });
      setBulkSearchTerm('');
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableStudents();
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
    
    // Check if course is completed
    if (isCourseCompleted()) {
      setMessage({ text: 'Cannot assign students to a completed course', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    // Check if student is already enrolled
    const student = allStudents.find(s => s.user_id === selectedStudent);
    if (student && student.is_enrolled) {
      setMessage({ text: 'This student is already enrolled in the course', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
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
      await fetchAvailableStudents();
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
    
    // Check if course is completed
    if (isCourseCompleted()) {
      setMessage({ text: 'Cannot assign teachers to a completed course', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api(`/course-teachers/${course.course_id}/assign-teacher`, 'POST', {
        teacher_id: parseInt(selectedTeacher)
      });
      
      setMessage({ text: 'Teacher assigned successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowAssignTeacherModal(false);
      setSelectedTeacher('');
      setTeacherSearchTerm('');
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableTeachers();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      const errorMessage = error.response?.data?.error || 'Failed to assign teacher';
      setMessage({ text: errorMessage, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    setIsSubmitting(true);
    try {
      await api(`/enrollment/${course.course_id}/remove-student/${studentToRemove.user_id}`, 'DELETE');
      
      setMessage({ text: 'Student removed successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowRemoveStudentModal(false);
      setStudentToRemove(null);
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      setMessage({ text: 'Failed to remove student', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRemoveStudentModal = (student) => {
    setStudentToRemove(student);
    setShowRemoveStudentModal(true);
  };

  const handleRemoveTeacher = async () => {
    if (!teacherToRemove) return;
    
    setIsSubmitting(true);
    try {
      await api(`/course-teachers/${course.course_id}/remove-teacher/${teacherToRemove.user_id}`, 'DELETE');
      
      setMessage({ text: 'Teacher removed successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      setShowRemoveTeacherModal(false);
      setTeacherToRemove(null);
      
      // Refresh course details
      await fetchCourseDetails();
      await fetchAvailableTeachers();
    } catch (error) {
      console.error('Error removing teacher:', error);
      setMessage({ text: 'Failed to remove teacher', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRemoveTeacherModal = (teacher) => {
    setTeacherToRemove(teacher);
    setShowRemoveTeacherModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-300">Loading course details...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Course not found</p>
          <button
            onClick={() => navigate('/admin/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/admin/courses')}
            className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2"
          >
            ← Back to Courses
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{course.course_code} - {course.course_name}</h1>
            {isCourseCompleted() && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
                Course Completed
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-2">{course.description}</p>
          {course.end_date && (
            <p className="text-gray-400 text-sm mt-1">
              End Date: {new Date(course.end_date).toLocaleDateString()}
            </p>
          )}
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
              disabled={isCourseCompleted()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCourseCompleted() 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={isCourseCompleted() ? 'Cannot assign students to completed course' : 'Assign Student'}
            >
              + Assign Student
            </button>
          </div>
          {isCourseCompleted() && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ This course has passed its end date. No new students can be assigned.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {courseStats.students.length > 0 ? (
              <>
                {paginatedStudents.map((student) => (
                  <div key={student.user_id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
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
                    <button
                      onClick={() => openRemoveStudentModal(student)}
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded transition-colors"
                      title="Remove student from course"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <PaginationControls 
                  currentPage={currentStudentPage}
                  totalPages={totalStudentPages}
                  onPageChange={handlePageChange}
                  type="students"
                />
              </>
            ) : (
              <p className="text-gray-400 text-sm">No students enrolled</p>
            )}
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Teachers ({courseStats.teacherCount})</h2>
            <button
              onClick={() => setShowAssignTeacherModal(true)}
              disabled={isCourseCompleted()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCourseCompleted() 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isCourseCompleted() ? 'Cannot assign teachers to completed course' : 'Assign Teacher'}
            >
              + Assign Teacher
            </button>
          </div>
          {isCourseCompleted() && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ This course has passed its end date. No new teachers can be assigned.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {courseStats.teachers.length > 0 ? (
              <>
                {paginatedTeachers.map((teacher) => (
                  <div key={teacher.user_id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
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
                    <button
                      onClick={() => openRemoveTeacherModal(teacher)}
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded transition-colors"
                      title="Remove teacher from course"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <PaginationControls 
                  currentPage={currentTeacherPage}
                  totalPages={totalTeacherPages}
                  onPageChange={handlePageChange}
                  type="teachers"
                />
              </>
            ) : (
              <p className="text-gray-400 text-sm">No teachers assigned</p>
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
        setStudentFilters({ session: '', department_id: '' });
        setSearchTerm('');
        setBulkSearchTerm('');
        setShowSuggestions(false);
      }} title="Assign Students to Course">
        <div className="space-y-6">
          {/* Course Completion Warning */}
          {isCourseCompleted() && (
            <div className="p-4 bg-red-900 border border-red-600 rounded-lg">
              <p className="text-red-200 font-medium mb-2">⚠️ Course Completed</p>
              <p className="text-red-300 text-sm">
                This course has passed its end date. 
                Students cannot be assigned to completed courses.
              </p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBulkAssignMode(false)}
              disabled={isCourseCompleted()}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${!bulkAssignMode 
                ? 'bg-blue-600 text-white' 
                : `${isCourseCompleted() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
              }`}
            >
              Single Assignment
            </button>
            <button
              type="button"
              onClick={() => setBulkAssignMode(true)}
              disabled={isCourseCompleted()}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${bulkAssignMode 
                ? 'bg-blue-600 text-white' 
                : `${isCourseCompleted() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
              }`}
            >
              Bulk Assignment
            </button>
          </div>

          {!bulkAssignMode ? (
            /* Single Assignment Mode - With Filters and Search */
            <form onSubmit={handleAssignStudent} className="space-y-4">
              {/* Filters for Single Assignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Session (Batch Year)</label>
                  <select
                    value={studentFilters.session}
                    onChange={(e) => handleFilterChange('session', e.target.value)}
                    disabled={isCourseCompleted()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    value={studentFilters.department_id}
                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                    disabled={isCourseCompleted()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Departments</option>
                    {filterOptions.departments.map((department) => (
                      <option key={department.department_id} value={department.department_id}>{department.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block text-gray-300 text-sm font-medium mb-2">Search and Select Student</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  placeholder="Type student name or email..."
                  disabled={isCourseCompleted()}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map((student) => (
                      <button
                        key={student.user_id}
                        type="button"
                        onClick={() => !student.is_enrolled && handleSuggestionSelect(student)}
                        disabled={student.is_enrolled}
                        className={`w-full text-left px-4 py-3 border-b border-gray-600 last:border-b-0 ${
                          student.is_enrolled 
                            ? 'bg-gray-700 cursor-not-allowed opacity-60' 
                            : 'hover:bg-gray-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            student.is_enrolled ? 'bg-gray-500' : 'bg-blue-500'
                          }`}>
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${student.is_enrolled ? 'text-gray-400' : 'text-white'}`}>
                                {student.first_name} {student.last_name}
                              </p>
                              {student.is_enrolled && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                  Already Enrolled
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs">
                              {student.email} • {student.department_name || 'No Department'} • Batch {student.batch_year}
                            </p>
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
                  disabled={isSubmitting || !selectedStudent || isCourseCompleted()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* Filters - Session and Department Only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Session (Batch Year)</label>
                  <select
                    value={studentFilters.session}
                    onChange={(e) => handleFilterChange('session', e.target.value)}
                    disabled={isCourseCompleted()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Session</option>
                    {filterOptions.sessions.map((session) => (
                      <option key={session} value={session}>{session}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Department</label>
                  <select
                    value={studentFilters.department_id}
                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                    disabled={isCourseCompleted()}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Department</option>
                    {filterOptions.departments.map((department) => (
                      <option key={department.department_id} value={department.department_id}>{department.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Load Students Button */}
              {(!studentFilters.session || !studentFilters.department_id) && (
                <div className="text-center py-4 text-gray-400">
                  Please select both session and department to load students
                </div>
              )}

              {/* Student List with Search */}
              {(studentFilters.session && studentFilters.department_id) && (
                <div>
                  {/* Search within loaded students */}
                  <div className="mb-3">
                    <label className="block text-gray-300 text-sm font-medium mb-2">Search in loaded students</label>
                    <input
                      type="text"
                      value={bulkSearchTerm}
                      onChange={(e) => handleBulkSearchChange(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-gray-300 text-sm font-medium">Select Students ({selectedStudents.length} selected)</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const availableIds = displayedStudents
                              .filter(student => !student.is_enrolled)
                              .map(student => student.user_id);
                            setSelectedStudents(availableIds);
                          }}
                          className="text-sm text-green-400 hover:text-green-300"
                        >
                          Select All Available
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudents([])}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg p-3 space-y-2">
                      {displayedStudents.length === 0 ? (
                        <p className="text-gray-400 text-sm">No students found</p>
                      ) : (
                        displayedStudents.map((student) => (
                          <div key={student.user_id} className={`flex items-center space-x-3 p-2 rounded ${
                            student.is_enrolled ? 'bg-gray-700 opacity-60' : 'hover:bg-gray-700'
                          }`}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.user_id)}
                              onChange={() => !student.is_enrolled && handleStudentSelection(student.user_id)}
                              disabled={student.is_enrolled}
                              className={`w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 ${
                                student.is_enrolled ? 'cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm ${student.is_enrolled ? 'text-gray-400' : 'text-white'}`}>
                                  {student.first_name} {student.last_name}
                                </p>
                                {student.is_enrolled && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                    Enrolled
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs">
                                {student.email} • {student.department_name || 'No Department'} • Batch {student.batch_year}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={isSubmitting || selectedStudents.length === 0 || isCourseCompleted()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    setStudentFilters({ session: '', department_id: '' });
                    setBulkSearchTerm('');
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
      <Modal 
        show={showAssignTeacherModal} 
        size="lg"
        onClose={() => {
          setShowAssignTeacherModal(false);
          setSelectedTeacher('');
          setTeacherSearchTerm('');
          setShowTeacherSuggestions(false);
        }} 
        title="Assign Teacher to Course"
      >
        <div className="space-y-4">
          {/* Course Completion Warning */}
          {isCourseCompleted() && (
            <div className="p-4 bg-red-900 border border-red-600 rounded-lg">
              <p className="text-red-200 font-medium mb-2">⚠️ Course Completed</p>
              <p className="text-red-300 text-sm">
                This course has passed its end date. 
                Teachers cannot be assigned to completed courses.
              </p>
            </div>
          )}

          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div className="relative teacher-search-container">
              <label className="block text-gray-300 text-sm font-medium mb-2">Search for Teacher</label>
              <input
                type="text"
                value={teacherSearchTerm}
                onChange={(e) => handleTeacherSearch(e.target.value)}
                placeholder="Search by name or email..."
                disabled={isCourseCompleted()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {/* Search Suggestions */}
              {showTeacherSuggestions && filteredTeachers.length > 0 && !isCourseCompleted() && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredTeachers.map((teacher) => (
                    <div
                      key={teacher.user_id}
                      onClick={() => selectTeacherFromSearch(teacher)}
                      className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-white border-b border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium">{teacher.first_name} {teacher.last_name}</div>
                      <div className="text-sm text-gray-300">{teacher.email}</div>
                      {teacher.username && (
                        <div className="text-xs text-gray-400">@{teacher.username}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {showTeacherSuggestions && filteredTeachers.length === 0 && teacherSearchTerm && !isCourseCompleted() && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                  <div className="px-3 py-2 text-gray-400">No teachers found</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Or Select from Dropdown</label>
              <select
                value={selectedTeacher}
                onChange={(e) => {
                  setSelectedTeacher(e.target.value);
                  const teacher = allTeachers.find(t => t.user_id == e.target.value);
                  if (teacher) {
                    setTeacherSearchTerm(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
                  } else {
                    setTeacherSearchTerm('');
                  }
                  setShowTeacherSuggestions(false);
                }}
                disabled={isCourseCompleted()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isSubmitting || !selectedTeacher || isCourseCompleted()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  setTeacherSearchTerm('');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Remove Student Modal */}
      <Modal 
        show={showRemoveStudentModal} 
        onClose={() => {
          setShowRemoveStudentModal(false);
          setStudentToRemove(null);
        }} 
        title="Remove Student from Course"
      >
        <div className="space-y-4">
          {studentToRemove && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="text-white mb-2">Are you sure you want to remove this student from the course?</p>
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {studentToRemove.first_name?.[0]}{studentToRemove.last_name?.[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{studentToRemove.first_name} {studentToRemove.last_name}</p>
                  <p className="text-gray-400 text-sm">{studentToRemove.email}</p>
                  {studentToRemove.batch_year && (
                    <p className="text-blue-300 text-sm">Batch {studentToRemove.batch_year}</p>
                  )}
                </div>
              </div>
              <p className="text-yellow-200 text-sm mt-3">
                ⚠️ This action will remove the student's enrollment and may affect their progress data.
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleRemoveStudent}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Removing...
                </>
              ) : (
                'Remove Student'
              )}
            </button>
            <button 
              onClick={() => {
                setShowRemoveStudentModal(false);
                setStudentToRemove(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Teacher Modal */}
      <Modal 
        show={showRemoveTeacherModal} 
        onClose={() => {
          setShowRemoveTeacherModal(false);
          setTeacherToRemove(null);
        }} 
        title="Remove Teacher from Course"
      >
        <div className="space-y-4">
          {teacherToRemove && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <p className="text-white mb-2">Are you sure you want to remove this teacher from the course?</p>
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                  {teacherToRemove.first_name?.[0]}{teacherToRemove.last_name?.[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{teacherToRemove.first_name} {teacherToRemove.last_name}</p>
                  <p className="text-gray-400 text-sm">{teacherToRemove.email}</p>
                  {teacherToRemove.specialization && (
                    <p className="text-blue-300 text-sm">{teacherToRemove.specialization}</p>
                  )}
                </div>
              </div>
              <p className="text-yellow-200 text-sm mt-3">
                ⚠️ This action will remove the teacher's assignment from this course.
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={handleRemoveTeacher}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Removing...
                </>
              ) : (
                'Remove Teacher'
              )}
            </button>
            <button 
              onClick={() => {
                setShowRemoveTeacherModal(false);
                setTeacherToRemove(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetails;
