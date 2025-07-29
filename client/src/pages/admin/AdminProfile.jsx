import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-full">
      <h1 className="text-3xl font-bold mb-6 text-indigo-400">Admin Profile</h1>
      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center ring-4 ring-indigo-500">
          <span className="text-5xl font-bold text-indigo-300">{user.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{user.username}</h2>
          <p className="text-gray-400">{user.email}</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-300">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold text-indigo-400">Role:</p>
            <p className="text-lg">{user.role}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="font-semibold text-indigo-400">User ID:</p>
            <p className="text-lg">{user.user_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
