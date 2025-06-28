import { useState } from 'react';

export default function Assignments() {
  const [assignmentFile, setAssignmentFile] = useState(null);

  const handleFileChange = (e) => {
    setAssignmentFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (assignmentFile) {
      alert(`Uploading ${assignmentFile.name}`);
      // TODO: implement file upload logic
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assignments</h2>

      {/* Upload Assignment */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Upload Assignment</h3>
        <input type="file" onChange={handleFileChange} className="mt-2 block" />
        <button onClick={handleUpload} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Upload
        </button>
      </div>

      {/* Evaluate Submissions */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Evaluate Submissions</h3>
        {/* Dummy list - replace with actual data */}
        <ul className="space-y-3">
          <li className="flex justify-between items-center bg-gray-800 p-3 rounded">
            <span>Student: John Doe</span>
            <button className="text-sm bg-green-600 px-3 py-1 rounded">Download Submission</button>
            <input type="number" placeholder="Score" className="bg-gray-700 text-white px-2 py-1 rounded w-16 ml-4" />
            <button className="ml-2 text-sm bg-blue-600 px-3 py-1 rounded">Submit Grade</button>
          </li>
          {/* More student submissions... */}
        </ul>
      </div>
    </div>
  );
}