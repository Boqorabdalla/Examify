
import React, { useState } from 'react';
import { User } from '../../types';

interface UserManagementProps {
  users: User[];
  onAddUser: (username: string, password_provided: string) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setMessage('Username and password cannot be empty.');
      return;
    }
    onAddUser(username, password);
    setMessage(`User "${username}" created successfully.`);
    setUsername('');
    setPassword('');
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
        onDeleteUser(user.id);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
        <h3 className="text-xl font-semibold text-amber-400 mb-4">Add New Teacher</h3>
        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-grow w-full">
            <label className="block text-sm font-medium text-slate-300">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>
          <div className="flex-grow w-full">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500">
            Add User
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
      </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
        <h3 className="text-xl font-semibold text-amber-400 mb-4">Current Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-50">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
