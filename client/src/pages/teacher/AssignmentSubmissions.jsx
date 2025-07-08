import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editedPoints, setEditedPoints] = useState('');
  const [editedFeedback, setEditedFeedback] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const data = await api(`/submissions/assignment/${assignmentId}`);
        // API might return { message: 'No submissions...' } or an empty array
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
        setError('Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [assignmentId]);

  const handleEditClick = submission => {
    setEditingSubmissionId(submission.submission_id);
    setEditedPoints(submission.points_earned || '');
    setEditedFeedback(submission.feedback || '');
  };

  const handleSaveClick = async submissionId => {
    if (!user || !user.user_id) {
      setError('User not authenticated.');
      return;
    }

    try {
      const updatedSubmission = await api(`/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_earned: editedPoints === '' ? null : parseFloat(editedPoints),
          feedback: editedFeedback,
          graded_by: user.user_id,
        }),
      });

      setSubmissions(prev =>
        prev.map(sub =>
          sub.submission_id === submissionId ? updatedSubmission.submission : sub
        )
      );
      setEditingSubmissionId(null);
      setEditedPoints('');
      setEditedFeedback('');
    } catch (err) {
      console.error('Failed to update submission:', err);
      setError('Failed to save submission.');
    }
  };

  if (loading) {
    return <p className="p-4">Loading submissions...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-400">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Assignment Submissions</h2>

      {submissions.length > 0 ? (
        <ul className="space-y-4">
          {submissions.map(submission => (
            <li key={submission.submission_id} className="bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-lg font-semibold">Student: {submission.first_name} {submission.last_name} ({submission.username})</p>
              <p className="text-gray-400 text-sm">Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
              {submission.file_url && (
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                  Download Submission File
                </a>
              )}

              {editingSubmissionId === submission.submission_id ? (
                <div className="mt-4">
                  <div className="mb-2">
                    <label htmlFor={`points-${submission.submission_id}`} className="block text-sm font-medium text-gray-300">Points Earned</label>
                    <input
                      type="number"
                      id={`points-${submission.submission_id}`}
                      value={editedPoints}
                      onChange={e => setEditedPoints(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`feedback-${submission.submission_id}`} className="block text-sm font-medium text-gray-300">Feedback</label>
                    <textarea
                      id={`feedback-${submission.submission_id}`}
                      value={editedFeedback}
                      onChange={e => setEditedFeedback(e.target.value)}
                      rows="3"
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  <button
                    onClick={() => handleSaveClick(submission.submission_id)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSubmissionId(null)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-gray-300">Points: {submission.points_earned !== null ? submission.points_earned : 'N/A'}</p>
                  <p className="text-gray-300">Feedback: {submission.feedback || 'No feedback yet.'}</p>
                  {submission.graded_at && (
                    <p className="text-gray-400 text-sm">Graded: {new Date(submission.graded_at).toLocaleString()}</p>
                  )}
                  <button
                    onClick={() => handleEditClick(submission)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-2"
                  >
                    Grade / Edit
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No submissions for this assignment yet.</p>
      )}
    </div>
  );
}
