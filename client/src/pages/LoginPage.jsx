import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const role = data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else if (role === 'student') navigate('/student');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded shadow-lg w-full max-w-sm">
        <h1 className="text-2xl mb-4 font-bold text-center">Unitrack Login</h1>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 bg-gray-700 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 bg-gray-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
        >
          Login
        </button>
      </div>
    </div>
  );
}