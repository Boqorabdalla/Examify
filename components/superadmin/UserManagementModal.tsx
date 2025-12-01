import React, { useState } from 'react';
import { Institution, User } from '../../types';

interface UserManagementModalProps {
  institution: Institution;
  users: User[];
  onClose: () => void;
  onUpdateCredentials: (userId: string, newUsername: string, newPassword_provided: string) => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ institution, users, onClose, onUpdateCredentials }) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setUsername(user.username);
    setPassword('');
    setMessage(null);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
  };

  const handleSave = () => {
    if (!editingUserId) return;
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Username and new password are required.' });
      return;
    }
    if (password.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
        return;
    }

    onUpdateCredentials(editingUserId, username, password);
    setMessage({ type: 'success', text: `Credentials for ${username} updated.` });
    setEditingUserId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 w-full max-w-3xl">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-amber-400">Manage Users for: {institution.name}</h3>
        </div>
        
        <div className="p-6">
          {message && (
            <p className={`mb-4 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
            </p>
          )}
          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">New Password</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {users.map(user => (
                  <tr key={user.id}>
                    {editingUserId === user.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-1 px-2 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <input 
                            type="text" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-1 px-2 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={handleSave} className="text-green-400 hover:text-green-300">Save</button>
                          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-300">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-50">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 italic">Hidden</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEditClick(user)} className="text-amber-400 hover:text-amber-300">Reset Credentials</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-600 text-slate-200 text-sm font-medium rounded-md shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;