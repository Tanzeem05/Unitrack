import { Link } from 'react-router-dom';

export default function CoursesPage() {
  const dummyCourses = [
    { id: 1, name: 'Math 101' },
    { id: 2, name: 'Physics 202' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Courses</h1>
      <ul className="space-y-2">
        {dummyCourses.map(course => (
          <li key={course.id}>
            <Link to={`courses/${course.id}`} className="text-blue-400 hover:underline">
              {course.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}