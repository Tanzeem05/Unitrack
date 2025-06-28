import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Assignments({ courseCode }) {
  const [assignments, setAssignments] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await axios.get(`/api/assignments/course_code/${courseCode}`);
        // Defensive check: only set if data is an array
        if (Array.isArray(res.data)) {
          setAssignments(res.data);
        } else {
          setAssignments([]); // fallback to empty array
          console.error('API response is not an array:', res.data);
        }
      } catch (err) {
        console.error(err);
        setAssignments([]); // fallback to empty array on error
      }
    };
    fetchAssignments();
  }, [courseCode]);

  const handleSubmit = async (e, assignmentId) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`/api/student/courses/${courseCode}/assignments/${assignmentId}/submit`, formData);
      alert('Assignment submitted!');
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>
      {assignments.map(a => (
        <div key={a.assignment_id} className="mb-6 p-4 border border-gray-700 rounded">
          <h3 className="text-lg font-bold">{a.title}</h3>
          <p className="text-sm mb-2">{a.description}</p>
          <form onSubmit={(e) => handleSubmit(e, a.assignment_id)} className="space-y-2">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="block" required />
            <button type="submit" className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-700">Submit</button>
          </form>
        </div>
      ))}
    </div>
  );
}
