import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Submissions({ courseId: propCourseId }) {
  const { courseId: paramCourseId, assignmentId } = useParams();
  const courseId = propCourseId || paramCourseId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editedPoints, setEditedPoints] = useState('');
  const [editedFeedback, setEditedFeedback] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await api(`/submissions/course/${courseId}/assignments`);
        setAssignments(data || []);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
        setError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  // Auto-select assignment if assignmentId is provided in URL
  useEffect(() => {
    if (assignmentId && assignments.length > 0) {
      const assignment = assignments.find(a => a.assignment_id === parseInt(assignmentId));
      if (assignment) {
        fetchSubmissions(assignmentId);
      }
    }
  }, [assignmentId, assignments]);

  const fetchSubmissions = async (assignmentId) => {
    try {
      setSubmissionsLoading(true);
      const data = await api(`/submissions/assignment/${assignmentId}`);
      setSelectedAssignment(data.assignment);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      setError('Failed to load submissions.');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleEditClick = (submission) => {
    setEditingSubmissionId(submission.submission_id);
    setEditedPoints(submission.points_earned || '');
    setEditedFeedback(submission.feedback || '');
  };

  // const handleSaveClick = async (submissionId) => {
  //   if (!user || !user.user_id) {
  //     setError('User not authenticated.');
  //     return;
  //   }

  //   try {
  //     const updatedSubmission = await api(`/submissions/${submissionId}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         points_earned: editedPoints === '' ? null : parseFloat(editedPoints),
  //         feedback: editedFeedback,
  //         graded_by: user.user_id,
  //       }),
  //     });

  //     setSubmissions(prev =>
  //       prev.map(sub =>
  //         sub.submission_id === submissionId ? { ...sub, ...updatedSubmission.submission } : sub
  //       )
  //     );
  //     setEditingSubmissionId(null);
  //     setEditedPoints('');
  //     setEditedFeedback('');
  //   } catch (err) {
  //     console.error('Failed to update submission:', err);
  //     setError('Failed to save submission.');
  //   }
  // };

  const handleSaveClick = async (submissionId) => {
    if (!user || !user.user_id) {
      setError('User not authenticated.');
      return;
    }

    try {
      const updatedSubmission = await api(
        `/submissions/${submissionId}`,
        'PUT',
        {
          points_earned: editedPoints === '' ? null : parseFloat(editedPoints),
          feedback: editedFeedback,
          graded_by: user.user_id,
        },
        false // isFormData
      );

      setSubmissions(prev =>
        prev.map(sub =>
          sub.submission_id === submissionId
            ? { ...sub, ...updatedSubmission.submission }
            : sub
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


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-600 text-white p-3 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {!selectedAssignment ? (
        // Assignment List View
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Assignment Submissions</h2>

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No assignments found</div>
              <p className="text-gray-500 mt-2">Create assignments first to see submissions</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <button
                        onClick={() => fetchSubmissions(assignment.assignment_id)}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        {assignment.title}
                      </button>
                      <p className="text-gray-300 mb-3">{assignment.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Due Date:</span>
                          <p className="text-white">{formatDate(assignment.due_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Max Points:</span>
                          <p className="text-white">{assignment.max_points}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Submissions:</span>
                          <p className="text-white">
                            {assignment.submission_count} total • {assignment.graded_count} graded
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => fetchSubmissions(assignment.assignment_id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Submissions ({assignment.submission_count})
                      </button>

                      {assignment.file_url && (
                        <a
                          href={assignment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center text-sm"
                        >
                          Download Assignment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Submissions View for Selected Assignment
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Submissions for: {selectedAssignment.title}</h2>
              <p className="text-gray-400 mt-1">
                Due: {formatDate(selectedAssignment.due_date)} • Max Points: {selectedAssignment.max_points}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedAssignment(null);
                setSubmissions([]);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Assignments
            </button>
          </div>

          {submissionsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No submissions yet</div>
              <p className="text-gray-500 mt-2">Students haven't submitted their assignments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.submission_id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {submission.first_name} {submission.last_name}
                      </h3>
                      <p className="text-gray-400 text-sm">@{submission.username}</p>
                      <p className="text-gray-400 text-sm">
                        Submitted: {formatDate(submission.submitted_at)}
                      </p>
                    </div>

                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download File</span>
                      </a>
                    )}
                  </div>

                  {editingSubmissionId === submission.submission_id ? (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Points Earned (Max: {selectedAssignment.max_points})
                          </label>
                          <input
                            type="number"
                            value={editedPoints}
                            onChange={(e) => setEditedPoints(e.target.value)}
                            min="0"
                            max={selectedAssignment.max_points}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter points..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Feedback
                          </label>
                          <textarea
                            value={editedFeedback}
                            onChange={(e) => setEditedFeedback(e.target.value)}
                            rows="3"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter feedback..."
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={() => handleSaveClick(submission.submission_id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Grade
                        </button>
                        <button
                          onClick={() => {
                            setEditingSubmissionId(null);
                            setEditedPoints('');
                            setEditedFeedback('');
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-gray-400 text-sm">Points Earned:</span>
                          <p className="text-white text-lg">
                            {submission.points_earned !== null ? `${submission.points_earned}/${selectedAssignment.max_points}` : 'Not graded'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Feedback:</span>
                          <p className="text-gray-300">
                            {submission.feedback || 'No feedback provided'}
                          </p>
                        </div>
                      </div>

                      {submission.graded_at && (
                        <p className="text-gray-400 text-sm mb-3">
                          Graded on {formatDate(submission.graded_at)} by {submission.grader_first_name} {submission.grader_last_name}
                        </p>
                      )}

                      <button
                        onClick={() => handleEditClick(submission)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        {submission.points_earned !== null ? 'Edit Grade' : 'Grade Submission'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
