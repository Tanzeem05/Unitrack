import { useState, useEffect } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Assignments() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: '',
    weight_percentage: '',
    assignmentFile: null,
  });

  // Helper function to show error popup
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorPopup(true);
    // Hide popup after 5 seconds
    setTimeout(() => {
      setShowErrorPopup(false);
      setErrorMessage('');
    }, 5000);
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await api(`/assignments/course/${courseId}`);
        setAssignments(data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
        showError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewAssignment(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = e => {
    setNewAssignment(prev => ({
      ...prev,
      assignmentFile: e.target.files[0],
    }));
  };

  // const handleSubmit = async e => {
  //   e.preventDefault();
  //   if (!user || !user.user_id) {
  //     setError('User not authenticated.');
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append('course_id', courseId);
  //   formData.append('title', newAssignment.title);
  //   formData.append('description', newAssignment.description);
  //   formData.append('due_date', newAssignment.due_date);
  //   formData.append('max_points', newAssignment.max_points);
  //   formData.append('weight_percentage', newAssignment.weight_percentage);
  //   formData.append('created_by', user.user_id);
  //   if (newAssignment.assignmentFile) {
  //     formData.append('assignmentFile', newAssignment.assignmentFile);
  //   }

  //   try {
  //     const response = await api(`/`, { method: 'POST', body: formData, isFormData: true });
  //     setAssignments(prev => [...prev, response.assignment]);
  //     setNewAssignment({
  //       title: '',
  //       description: '',
  //       due_date: '',
  //       max_points: '',
  //       weight_percentage: '',
  //       assignmentFile: null,
  //     });
  //     setShowCreateForm(false);
  //   } catch (err) {
  //     console.error('Failed to create assignment:', err);
  //     setError('Failed to create assignment.');
  //   }
  // };

  const handleSubmit = async e => {
  e.preventDefault();
  
  // Set loading state
  setIsCreating(true);
  
  // Debug: Check user and course data
  console.log('Current user:', user);
  console.log('Course ID from URL:', courseId);
  console.log('User ID:', user?.user_id || user?.id);
  
  // Validate user authentication
  if (!user || (!user.user_id && !user.id)) {
    showError('User not authenticated properly.');
    setIsCreating(false);
    return;
  }

  // Validate course ID
  if (!courseId || isNaN(courseId)) {
    showError('Invalid course ID.');
    setIsCreating(false);
    return;
  }

  // Validate required fields
  if (!newAssignment.title || !newAssignment.due_date || !newAssignment.max_points || !newAssignment.weight_percentage) {
    showError('Please fill in all required fields.');
    setIsCreating(false);
    return;
  }

  // Format the date properly for PostgreSQL
  const formattedDate = new Date(newAssignment.due_date).toISOString();

  const formData = new FormData();
  formData.append('course_id', parseInt(courseId)); // Ensure it's an integer
  formData.append('title', newAssignment.title);
  formData.append('description', newAssignment.description);
  formData.append('due_date', formattedDate);
  formData.append('max_points', parseInt(newAssignment.max_points));
  formData.append('weight_percentage', parseFloat(newAssignment.weight_percentage));
  // Remove created_by - it will come from authenticated user
  
  if (newAssignment.assignmentFile) {
    formData.append('assignmentFile', newAssignment.assignmentFile);
  }

  // Debug: Log what we're sending
  console.log('Form data being sent:');
  for (let [key, value] of formData.entries()) {
    console.log(key, ':', value);
  }

  try {
    const response = await api('/assignments/', 'POST', formData, true);
    console.log('Server response:', response);
    
    setAssignments(prev => [...prev, response.assignment]);
    setNewAssignment({
      title: '',
      description: '',
      due_date: '',
      max_points: '',
      weight_percentage: '',
      assignmentFile: null,
    });
    setShowCreateForm(false);
    
    // Show success popup
    setSuccessMessage('Assignment created successfully!');
    setShowSuccessPopup(true);
    
    // Hide popup after 3 seconds
    setTimeout(() => {
      setShowSuccessPopup(false);
      setSuccessMessage('');
    }, 3000);
    
  } catch (err) {
    console.error('Failed to create assignment:', err);
    
    // Handle specific error cases with popup
    if (err.response?.status === 409) {
      showError('An assignment with this title already exists in this course. Please choose a different title.');
    } else if (err.response?.status === 403) {
      showError('You do not have permission to create assignments.');
    } else {
      showError(`Failed to create assignment: ${err.message}`);
    }
  } finally {
    setIsCreating(false);
  }
};

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      due_date: new Date(assignment.due_date).toISOString().slice(0, 16), // Format for datetime-local
      max_points: assignment.max_points.toString(),
      weight_percentage: assignment.weight_percentage.toString(),
      assignmentFile: null,
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!editingAssignment) return;
    
    // Set loading state
    setIsUpdating(true);
    
    // Validate required fields
    if (!newAssignment.title || !newAssignment.due_date || !newAssignment.max_points || !newAssignment.weight_percentage) {
      showError('Please fill in all required fields.');
      setIsUpdating(false);
      return;
    }

    // Format the date properly for PostgreSQL
    const formattedDate = new Date(newAssignment.due_date).toISOString();

    const formData = new FormData();
    formData.append('title', newAssignment.title);
    formData.append('description', newAssignment.description);
    formData.append('due_date', formattedDate);
    formData.append('max_points', parseInt(newAssignment.max_points));
    formData.append('weight_percentage', parseFloat(newAssignment.weight_percentage));
    
    if (newAssignment.assignmentFile) {
      formData.append('assignmentFile', newAssignment.assignmentFile);
    }

    try {
      const response = await api(`/assignments/${editingAssignment.assignment_id}`, 'PUT', formData, true);
      
      // Update the assignments list
      setAssignments(prev => prev.map(assignment => 
        assignment.assignment_id === editingAssignment.assignment_id 
          ? response.assignment 
          : assignment
      ));
      
      // Reset form
      setNewAssignment({
        title: '',
        description: '',
        due_date: '',
        max_points: '',
        weight_percentage: '',
        assignmentFile: null,
      });
      setShowEditForm(false);
      setEditingAssignment(null);
      
      // Show success popup
      setSuccessMessage('Assignment updated successfully!');
      setShowSuccessPopup(true);
      
      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Failed to update assignment:', err);
      
      // Handle specific error cases with popup
      if (err.response?.status === 409) {
        showError('An assignment with this title already exists in this course. Please choose a different title.');
      } else if (err.response?.status === 404) {
        showError('Assignment not found.');
      } else {
        showError(`Failed to update assignment: ${err.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await api(`/assignments/${assignmentId}`, 'DELETE');
      
      // Remove the assignment from the list
      setAssignments(prev => prev.filter(assignment => assignment.assignment_id !== assignmentId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      setError(`Failed to delete assignment: ${err.message}`);
    }
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingAssignment(null);
    setNewAssignment({
      title: '',
      description: '',
      due_date: '',
      max_points: '',
      weight_percentage: '',
      assignmentFile: null,
    });
  };

  if (loading) {
    return <p className="p-4">Loading assignments...</p>;
  }

  return (
    <div className="p-4">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>❌</span>
          <span>{errorMessage}</span>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      <button
        onClick={() => {
          setShowCreateForm(!showCreateForm);
          if (showEditForm) {
            cancelEdit();
          }
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {showCreateForm ? 'Cancel' : 'Create New Assignment'}
      </button>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">New Assignment</h3>
          <div className="mb-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newAssignment.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="description"
              name="description"
              value={newAssignment.description}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
          <div className="mb-2">
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-300">Due Date</label>
            <input
              type="datetime-local"
              id="due_date"
              name="due_date"
              value={newAssignment.due_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="max_points" className="block text-sm font-medium text-gray-300">Max Points</label>
            <input
              type="number"
              id="max_points"
              name="max_points"
              value={newAssignment.max_points}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="weight_percentage" className="block text-sm font-medium text-gray-300">Weight Percentage</label>
            <input
              type="number"
              id="weight_percentage"
              name="weight_percentage"
              value={newAssignment.weight_percentage}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-300">Assignment File (Optional)</label>
            <input
              type="file"
              id="assignmentFile"
              name="assignmentFile"
              onChange={handleFileChange}
              className="mt-1 block w-full text-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating assignment...
              </>
            ) : (
              'Create Assignment'
            )}
          </button>
        </form>
      )}

      {showEditForm && editingAssignment && (
        <form onSubmit={handleUpdate} className="bg-gray-800 p-4 rounded-lg mb-6 border-2 border-yellow-500">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">Edit Assignment</h3>
          <div className="mb-2">
            <label htmlFor="edit_title" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="edit_title"
              name="title"
              value={newAssignment.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="edit_description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="edit_description"
              name="description"
              value={newAssignment.description}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500"
            ></textarea>
          </div>
          <div className="mb-2">
            <label htmlFor="edit_due_date" className="block text-sm font-medium text-gray-300">Due Date</label>
            <input
              type="datetime-local"
              id="edit_due_date"
              name="due_date"
              value={newAssignment.due_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="edit_max_points" className="block text-sm font-medium text-gray-300">Max Points</label>
            <input
              type="number"
              id="edit_max_points"
              name="max_points"
              value={newAssignment.max_points}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="edit_weight_percentage" className="block text-sm font-medium text-gray-300">Weight Percentage</label>
            <input
              type="number"
              id="edit_weight_percentage"
              name="weight_percentage"
              value={newAssignment.weight_percentage}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="edit_assignmentFile" className="block text-sm font-medium text-gray-300">Assignment File (Optional - leave empty to keep current file)</label>
            <input
              type="file"
              id="edit_assignmentFile"
              name="assignmentFile"
              onChange={handleFileChange}
              className="mt-1 block w-full text-gray-300"
            />
            {editingAssignment.file_url && (
              <p className="text-sm text-gray-400 mt-1">
                Current file: <a href={editingAssignment.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View current file</a>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating assignment...
                </>
              ) : (
                'Update Assignment'
              )}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isUpdating}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {assignments.length > 0 ? (
        <ul className="space-y-3">
          {assignments.map(assignment => (
            <li key={assignment.assignment_id} className="bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <Link to={`${assignment.assignment_id}/submissions`} className="text-blue-400 hover:underline text-lg font-semibold">
                  {assignment.title}
                </Link>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.assignment_id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">Due: {new Date(assignment.due_date).toLocaleString()}</p>
              <p className="text-gray-300 mb-3">{assignment.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-300">📊 {assignment.max_points} points</span>
                  <span className="text-green-300">⚖️ {assignment.weight_percentage}%</span>
                </div>
                {assignment.file_url && (
                  <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-sm">
                    📎 Download File
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No assignments created for this course yet.</p>
      )}
      <Outlet />
    </div>
  );
}