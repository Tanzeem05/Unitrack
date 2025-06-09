import { useEffect, useState } from 'react';
import { fetchUsers } from './api/users';

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.user_id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;