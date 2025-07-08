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

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    max_points: '',
    weight_percentage: '',
    assignmentFile: null,
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await api(`/assignments/course/${courseId}`);
        setAssignments(data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
        setError('Failed to load assignments.');
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user || !user.user_id) {
      setError('User not authenticated.');
      return;
    }

    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('title', newAssignment.title);
    formData.append('description', newAssignment.description);
    formData.append('due_date', newAssignment.due_date);
    formData.append('max_points', newAssignment.max_points);
    formData.append('weight_percentage', newAssignment.weight_percentage);
    formData.append('created_by', user.user_id);
    if (newAssignment.assignmentFile) {
      formData.append('assignmentFile', newAssignment.assignmentFile);
    }

    try {
      const response = await api(`/assignments`, { method: 'POST', body: formData, isFormData: true });
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
    } catch (err) {
      console.error('Failed to create assignment:', err);
      setError('Failed to create assignment.');
    }
  };

  if (loading) {
    return <p className="p-4">Loading assignments...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-400">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
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
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Assignment
          </button>
        </form>
      )}

      {assignments.length > 0 ? (
        <ul className="space-y-3">
          {assignments.map(assignment => (
            <li key={assignment.assignment_id} className="bg-gray-800 p-4 rounded-lg shadow">
              <Link to={`${assignment.assignment_id}/submissions`} className="text-blue-400 hover:underline text-lg font-semibold">
                {assignment.title}
              </Link>
              <p className="text-gray-400 text-sm">Due: {new Date(assignment.due_date).toLocaleString()}</p>
              <p className="text-gray-300">{assignment.description}</p>
              {assignment.file_url && (
                <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-sm">
                  Download Assignment File
                </a>
              )}
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